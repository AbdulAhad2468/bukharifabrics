'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, Check, Eye, EyeOff, ImagePlus, LoaderCircle, LogOut, PackagePlus, Pencil, RefreshCw, Search, Sparkles, X } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';

const ADMIN_EMAIL = 'bukharifabricstailoring@gmail.com';
const fields = 'id,name,category,description,price,image_url,images,badge,rating,is_new,is_featured,discount_percent,stock_meters,is_active,sort_order,created_at';
const categories = ['lawn', 'ivory', 'linen', 'silk', 'winter', 'luxury'];
type Product = { id:number; name:string; category:string; description:string; price:number; image_url:string; images:string[]; badge:string|null; rating:number; is_new:boolean; is_featured:boolean; discount_percent:number; stock_meters:number; is_active:boolean; sort_order:number; created_at:string };
type StagedImage = { file:File; preview:string };
const price = (value:number) => new Intl.NumberFormat('en-PK',{style:'currency',currency:'PKR',maximumFractionDigits:0}).format(value);

export default function AdminDashboard(){
  const supabase=getSupabase();
  const [email,setEmail]=useState('');
  const [products,setProducts]=useState<Product[]>([]);
  const [query,setQuery]=useState('');
  const [category,setCategory]=useState('all');
  const [editing,setEditing]=useState<Product|null>(null);
  const [gallery,setGallery]=useState<string[]>([]);
  const [files,setFiles]=useState<StagedImage[]>([]);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [message,setMessage]=useState('');
  const previewUrls=useRef<string[]>([]);
  const isAdmin=email.toLowerCase()===ADMIN_EMAIL;

  const refresh=useCallback(async()=>{
    if(!supabase)return;
    const {data,error}=await supabase.from('products').select(fields).order('is_featured',{ascending:false}).order('sort_order',{ascending:true}).order('created_at',{ascending:false});
    if(error){setMessage(error.message);return;}
    setProducts((data||[]) as Product[]);
  },[supabase]);

  useEffect(()=>{
    let active=true;
    if(!supabase){setLoading(false);return;}
    supabase.auth.getUser().then(({data})=>{if(active)setEmail(data.user?.email||'');}).finally(()=>{if(active)setLoading(false)});
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>setEmail(session?.user.email||''));
    return()=>{active=false;subscription.unsubscribe()};
  },[supabase]);

  useEffect(()=>{if(isAdmin)void refresh()},[isAdmin,refresh]);
  useEffect(()=>()=>previewUrls.current.forEach(url=>URL.revokeObjectURL(url)),[]);

  const visible=useMemo(()=>products.filter(p=>(category==='all'||p.category===category)&&(!query||`${p.name} ${p.description} ${p.category}`.toLowerCase().includes(query.toLowerCase()))),[products,category,query]);
  const activeCount=products.filter(p=>p.is_active).length;
  const featuredCount=products.filter(p=>p.is_featured&&p.is_active).length;
  const categoryCount=new Set(products.filter(p=>p.is_active).map(p=>p.category)).size;
  const releaseFiles=()=>{files.forEach(item=>URL.revokeObjectURL(item.preview));previewUrls.current=previewUrls.current.filter(url=>!files.some(item=>item.preview===url));setFiles([])};
  const closeEditor=()=>{setEditing(null);setGallery([]);releaseFiles()};
  const beginEdit=(product:Product)=>{setEditing(product);setGallery(product.images?.length?product.images:[product.image_url]);releaseFiles();window.scrollTo({top:0,behavior:'smooth'})};
  const stageFiles=(list:FileList|null)=>{
    const picked=Array.from(list||[]);
    if(gallery.length+files.length+picked.length>10){setMessage('A product can have up to 10 photos.');return}
    if(picked.some(file=>!['image/jpeg','image/png','image/webp'].includes(file.type))){setMessage('Use JPG, PNG or WebP photos.');return}
    if(picked.some(file=>file.size>8*1024*1024)){setMessage('Each photo must be 8 MB or smaller.');return}
    setFiles(current=>[...current,...picked.map(file=>{const preview=URL.createObjectURL(file);previewUrls.current.push(preview);return {file,preview}})]);
  };
  const save=async(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();
    if(!supabase||!isAdmin){setMessage('Admin access is required.');return}
    if(gallery.length+files.length<1){setMessage('Add at least one product photo.');return}
    setSaving(true);setMessage('');
    try{
      const form=new FormData(event.currentTarget);
      const images=[...gallery];
      for(const item of files){
        const safe=item.file.name.toLowerCase().replace(/[^a-z0-9.-]+/g,'-');
        const path=`products/${crypto.randomUUID()}-${safe}`;
        const {error}=await supabase.storage.from('product-images').upload(path,item.file,{upsert:false,contentType:item.file.type});
        if(error)throw error;
        images.push(supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl);
      }
      const payload={
        name:String(form.get('name')).trim(), category:String(form.get('category')),
        description:String(form.get('description')).trim(), price:Number(form.get('price')),
        image_url:images[0], images, badge:String(form.get('badge')||'').trim()||null,
        rating:Number(form.get('rating')||4.8), is_new:form.get('is_new')==='on',
        is_featured:form.get('is_featured')==='on', discount_percent:Number(form.get('discount_percent')||0),
        stock_meters:Number(form.get('stock_meters')||0), is_active:form.get('is_active')==='on',
        sort_order:Number(form.get('sort_order')||100),
      };
      const result=editing?await supabase.from('products').update(payload).eq('id',editing.id):await supabase.from('products').insert(payload);
      if(result.error)throw result.error;
      closeEditor();
      setMessage(editing?'Changes saved.':'Product added to the store.');
      await refresh();
    }catch(error){setMessage(error instanceof Error?error.message:'Could not save the product. Check your Supabase setup.')}
    finally{setSaving(false)}
  };
  const toggleVisibility=async(product:Product)=>{
    if(!supabase)return;
    const {error}=await supabase.from('products').update({is_active:!product.is_active}).eq('id',product.id);
    if(error){setMessage(error.message);return}
    setProducts(current=>current.map(item=>item.id===product.id?{...item,is_active:!item.is_active}:item));
    setMessage(product.is_active?'Product hidden from the storefront.':'Product is live on the storefront.');
  };

  return <main className="admin-app">
    <header className="admin-topbar"><a href="/" className="admin-brand"><span className="admin-brand-mark">B</span><span><strong>Bukhari Fabrics</strong><small>STORE ADMIN</small></span></a><div className="admin-top-actions"><a href="/" className="admin-back-link"><ArrowLeft size={15}/> Storefront</a>{isAdmin&&<button className="admin-signout" onClick={async()=>{await supabase?.auth.signOut();window.location.assign('/')}}><LogOut size={15}/><span>Sign out</span></button>}</div></header>
    {loading?<div className="admin-state"><LoaderCircle className="spin"/><span>Checking your admin access…</span></div>:!supabase?<div className="admin-state admin-state-card"><h1>Connect Supabase to manage your store</h1><p>Add your Supabase project URL and publishable key to the Vercel environment settings, then redeploy.</p><a href="/">Return to storefront</a></div>:!isAdmin?<div className="admin-state admin-state-card"><span className="admin-state-icon"><Eye size={22}/></span><h1>Admin access required</h1><p>This dashboard is available to <strong>{ADMIN_EMAIL}</strong>.{email&&<> You are signed in as <strong>{email}</strong>.</>}</p><a className="admin-primary-link" href="/">Return to storefront sign-in</a></div>:<div className="admin-layout">
      <aside className="admin-sidebar"><div className="admin-side-label">WORKSPACE</div><a className="admin-side-active" href="#overview">Overview</a><a href="#inventory">Products</a><a href="/privacy-policy">Privacy policy</a><div className="admin-side-bottom"><Sparkles size={16}/><span>Manage the fabrics<br/>your customers see.</span></div></aside>
      <section className="admin-main" id="overview">
        <div className="admin-welcome"><div><span className="admin-kicker">STORE OVERVIEW</span><h1>Good to see you.</h1><p>Manage your catalogue, offers and what appears first in your shop.</p></div><button className="admin-add-button" onClick={()=>{closeEditor();document.querySelector('#product-editor')?.scrollIntoView({behavior:'smooth',block:'start'})}}><PackagePlus size={17}/> Add a product</button></div>
        <div className="admin-stat-grid"><article><span>Active products</span><strong>{activeCount}</strong><small>Visible to customers</small></article><article><span>Featured on home</span><strong>{featuredCount}</strong><small>Sorted by display order</small></article><article><span>Collections</span><strong>{categoryCount}</strong><small>With active products</small></article><article><span>In catalogue</span><strong>{products.length}</strong><small>Including hidden products</small></article></div>
        <section className="admin-editor-card" id="product-editor"><div className="admin-section-heading"><div><span className="admin-kicker">CATALOGUE EDITOR</span><h2>{editing?'Edit fabric':'Add a fabric'}</h2></div>{editing&&<button className="admin-quiet-button" onClick={closeEditor}><X size={15}/> Cancel</button>}</div>
          <form className="admin-editor-form" key={editing?.id??'create'} onSubmit={save}>
            <div className="admin-fields-grid"><label>Product name<input name="name" defaultValue={editing?.name||''} placeholder="e.g. Embroidered Summer Lawn" required maxLength={120}/></label><label>Collection<select name="category" defaultValue={editing?.category||'lawn'}>{categories.map(item=><option key={item} value={item}>{item.charAt(0).toUpperCase()+item.slice(1)}</option>)}</select></label><label>Price per metre <small>PKR</small><input name="price" type="number" min="0" step="1" defaultValue={editing?.price||''} placeholder="4500" required/></label><label>Discount <small>%</small><input name="discount_percent" type="number" min="0" max="90" step="1" defaultValue={editing?.discount_percent||0}/></label><label>Available stock <small>metres</small><input name="stock_meters" type="number" min="0" step="0.25" defaultValue={editing?.stock_meters||0}/></label><label>Display order <small>lower numbers first</small><input name="sort_order" type="number" defaultValue={editing?.sort_order??100}/></label><label className="admin-field-wide">Description<textarea name="description" rows={3} defaultValue={editing?.description||''} placeholder="Describe the fabric, feel and ideal use…" required maxLength={2000}/></label><label>Product badge<input name="badge" defaultValue={editing?.badge||''} placeholder="Optional · e.g. Best seller" maxLength={40}/></label><label>Rating<input name="rating" type="number" min="0" max="5" step="0.1" defaultValue={editing?.rating??4.8}/></label></div>
            <div className="admin-switches"><label><input type="checkbox" name="is_featured" defaultChecked={editing?.is_featured??false}/><span><strong>Feature on homepage</strong><small>Bring this product forward in the shop</small></span></label><label><input type="checkbox" name="is_new" defaultChecked={editing?.is_new??false}/><span><strong>New arrival</strong><small>Include in the new arrivals section</small></span></label><label><input type="checkbox" name="is_active" defaultChecked={editing?.is_active??true}/><span><strong>Visible in store</strong><small>Customers can browse and order this fabric</small></span></label></div>
            <div className="admin-upload-box"><div><strong>Product gallery</strong><small>Add up to 10 JPG, PNG or WebP images (8 MB max each)</small></div><label className="admin-upload-button"><ImagePlus size={17}/> Choose images<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={event=>{stageFiles(event.target.files);event.target.value=''}}/></label><div className="admin-image-grid">{gallery.map((src,index)=><div className="admin-image-thumb" key={`${src}-${index}`}><img src={src} alt={`Product photo ${index+1}`}/><button type="button" onClick={()=>setGallery(current=>current.filter((_,i)=>i!==index))} aria-label="Remove photo"><X size={14}/></button></div>)}{files.map((item,index)=><div className="admin-image-thumb" key={item.preview}><img src={item.preview} alt={item.file.name}/><button type="button" onClick={()=>setFiles(current=>current.filter((_,i)=>i!==index))} aria-label="Remove photo"><X size={14}/></button></div>)}{gallery.length+files.length===0&&<span className="admin-no-images">No photos selected yet</span>}</div><small className="admin-image-count">{gallery.length+files.length} / 10 images</small></div>
            <div className="admin-form-footer"><span>Changes save directly to your Supabase catalogue.</span><button className="admin-save-button" disabled={saving}>{saving?<><LoaderCircle className="spin" size={16}/> Saving…</>:<><Check size={16}/>{editing?'Save changes':'Add product'}</>}</button></div>
          </form>
        </section>
        <section className="admin-inventory" id="inventory"><div className="admin-inventory-heading"><div><span className="admin-kicker">YOUR SHOP</span><h2>Product catalogue</h2><p>Update price, stock, discounts and product visibility.</p></div><button className="admin-refresh-button" onClick={()=>void refresh()} aria-label="Refresh catalogue"><RefreshCw size={16}/></button></div><div className="admin-list-controls"><label className="admin-search"><Search size={17}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search products"/></label><select value={category} onChange={event=>setCategory(event.target.value)} aria-label="Filter by collection"><option value="all">All collections</option>{categories.map(item=><option key={item} value={item}>{item}</option>)}</select></div>{message&&<div className="admin-message" role="status">{message}<button onClick={()=>setMessage('')} aria-label="Dismiss message"><X size={14}/></button></div>}
          <div className="admin-product-list">{visible.length?visible.map(product=><article className="admin-inventory-card" key={product.id}><img className="admin-inventory-photo" src={product.image_url} alt=""/><div className="admin-inventory-details"><strong>{product.name}</strong><span>{product.category} <i>·</i> {price(product.price)} / m{product.discount_percent>0&&<em>{product.discount_percent}% OFF</em>}</span><small>{product.is_featured?'Featured':'Standard'} <i>·</i> {product.stock_meters} m stock <i>·</i> {product.is_active?'Live':'Hidden'}</small></div><div className="admin-inventory-actions"><button className="admin-icon-action" onClick={()=>void toggleVisibility(product)} aria-label={product.is_active?'Hide product':'Publish product'} title={product.is_active?'Hide product':'Publish product'}>{product.is_active?<EyeOff size={16}/>:<Eye size={16}/>}</button><button className="admin-edit-action" onClick={()=>beginEdit(product)}><Pencil size={15}/><span>Edit</span></button></div></article>):<div className="admin-empty-state">No products found. Add a fabric or change your search.</div>}</div>
        </section>
      </section>
    </div>}
    {message&&isAdmin&&<div className="admin-toast" role="status">{message}<button onClick={()=>setMessage('')} aria-label="Dismiss message"><X size={14}/></button></div>}
  </main>;
}
