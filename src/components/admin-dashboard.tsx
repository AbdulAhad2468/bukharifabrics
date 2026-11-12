'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Boxes, Check, ChevronDown, Eye, EyeOff, ImagePlus, LayoutDashboard, LoaderCircle, LogOut, Pencil, Plus, RefreshCw, Search, ShieldCheck, Sparkles, Store, X } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';

const ADMIN_EMAIL = 'bukharifabricstailoring@gmail.com';
const fields = 'id,name,category,description,price,image_url,images,badge,rating,is_new,is_featured,discount_percent,stock_meters,is_active,sort_order,created_at';
const categories = ['lawn', 'ivory', 'linen', 'silk', 'winter', 'luxury'];
// Register future admin sections here; each item points to a screen or page.
const adminSections = [
  { label:'Home', href:'#overview', icon:LayoutDashboard },
  { label:'Products', href:'#inventory', icon:Boxes },
  { label:'Privacy page', href:'/privacy-policy', icon:ShieldCheck },
];
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
  const [editorOpen,setEditorOpen]=useState(false);
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
  const closeEditor=()=>{setEditing(null);setEditorOpen(false);setGallery([]);releaseFiles()};
  const beginAdd=()=>{setEditing(null);setGallery([]);releaseFiles();setEditorOpen(true);window.setTimeout(()=>document.querySelector('#product-editor')?.scrollIntoView({behavior:'smooth',block:'start'}),20)};
  const beginEdit=(product:Product)=>{setEditing(product);setGallery(product.images?.length?product.images:[product.image_url]);releaseFiles();setEditorOpen(true);window.setTimeout(()=>document.querySelector('#product-editor')?.scrollIntoView({behavior:'smooth',block:'start'}),20)};
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
      setMessage(editing?'Saved! Your fabric details are updated.':'Done! Your new fabric is in the shop.');
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
    <header className="admin-topbar"><a href="/" className="admin-brand"><span className="admin-brand-mark">B</span><span><strong>Bukhari Fabrics</strong><small>MY SHOP</small></span></a><div className="admin-top-actions"><a href="/" className="admin-back-link"><Store size={17}/><span>View my shop</span></a>{isAdmin&&<button className="admin-signout" onClick={async()=>{await supabase?.auth.signOut();window.location.assign('/')}}><LogOut size={16}/><span>Sign out</span></button>}</div></header>
    {loading?<div className="admin-state"><LoaderCircle className="spin"/><span>Opening your shop…</span></div>:!supabase?<div className="admin-state admin-state-card"><h1>Let’s connect your shop</h1><p>Add your Supabase project URL and publishable key in Vercel, then deploy again.</p><a href="/">Back to the shop</a></div>:!isAdmin?<div className="admin-state admin-state-card"><span className="admin-state-icon"><Eye size={22}/></span><h1>This page is for the shop owner</h1><p>Sign in with <strong>{ADMIN_EMAIL}</strong>.{email&&<> You are currently signed in as <strong>{email}</strong>.</>}</p><a className="admin-primary-link" href="/">Go to sign in</a></div>:<div className="admin-layout">
      <aside className="admin-sidebar"><div className="admin-side-label">YOUR SHOP</div>{adminSections.map(section=>{const Icon=section.icon;return <a key={section.label} className={section.href==='#overview'?'admin-side-active':''} href={section.href}><Icon size={19}/><span>{section.label}</span></a>})}<div className="admin-side-bottom"><Sparkles size={18}/><span>More shop tools can<br/>be added here later.</span></div></aside>
      <section className="admin-main" id="overview">
        <div className="admin-welcome"><div><span className="admin-kicker">YOUR SHOP AT A GLANCE</span><h1>Hi! What would you like to do?</h1><p>Choose a big button below. We’ll guide you through each step.</p></div><a className="admin-view-shop" href="/" target="_blank" rel="noreferrer"><Store size={18}/> See my shop</a></div>
        <div className="admin-stat-grid"><article><span>Fabrics in my shop</span><strong>{activeCount}</strong><small>Customers can see these</small></article><article><span>Shown on the home page</span><strong>{featuredCount}</strong><small>Featured fabrics</small></article><article><span>Collections with fabrics</span><strong>{categoryCount}</strong><small>Groups of fabrics</small></article><article><span>All fabrics</span><strong>{products.length}</strong><small>Including hidden ones</small></article></div>
        <section className="admin-quick-actions" aria-label="Quick actions"><button onClick={beginAdd}><span className="admin-action-icon peach"><Plus size={26}/></span><span><strong>Add a fabric</strong><small>Put a new fabric in your shop</small></span><span className="admin-action-arrow">›</span></button><a href="#inventory"><span className="admin-action-icon lavender"><Pencil size={23}/></span><span><strong>Change a fabric</strong><small>Update photos, price, or stock</small></span><span className="admin-action-arrow">›</span></a><a href="/" target="_blank" rel="noreferrer"><span className="admin-action-icon mint"><Eye size={23}/></span><span><strong>Look at my shop</strong><small>See what customers can see</small></span><span className="admin-action-arrow">›</span></a></section>

        {editorOpen&&<section className="admin-editor-card" id="product-editor"><div className="admin-section-heading"><div><span className="admin-kicker">ONE EASY FORM</span><h2>{editing?'Change this fabric':'Add a fabric'}</h2><p>Fill in the simple steps, then press the big save button.</p></div><button className="admin-quiet-button" type="button" onClick={closeEditor}><X size={17}/> Close</button></div>
          <form className="admin-editor-form" key={editing?.id??'create'} onSubmit={save}>
            <section className="admin-form-step"><span className="admin-step-number">1</span><div className="admin-step-content"><h3>Tell us about the fabric</h3><p>Give it a name and choose where it belongs.</p><div className="admin-fields-grid"><label>Fabric name<input name="name" defaultValue={editing?.name||''} placeholder="For example: Blue summer lawn" required maxLength={120}/></label><label>Choose a collection<select name="category" defaultValue={editing?.category||'lawn'}>{categories.map(item=><option key={item} value={item}>{item.charAt(0).toUpperCase()+item.slice(1)}</option>)}</select></label><label className="admin-field-wide">A few words about it<textarea name="description" rows={3} defaultValue={editing?.description||''} placeholder="What does it feel like? What makes it special?" required maxLength={2000}/></label></div></div></section>
            <section className="admin-form-step"><span className="admin-step-number">2</span><div className="admin-step-content"><h3>Set the price and amount</h3><p>Prices are in Pakistani rupees and fabrics are sold by the metre.</p><div className="admin-fields-grid"><label>Price for 1 metre <small>PKR</small><input name="price" type="number" min="0" step="1" defaultValue={editing?.price||''} placeholder="4500" required/></label><label>Sale discount <small>leave 0 for no sale</small><input name="discount_percent" type="number" min="0" max="90" step="1" defaultValue={editing?.discount_percent||0}/></label><label>How many metres do you have?<input name="stock_meters" type="number" min="0" step="0.25" defaultValue={editing?.stock_meters||0}/></label></div></div></section>
            <section className="admin-form-step"><span className="admin-step-number">3</span><div className="admin-step-content"><h3>Add fabric pictures</h3><p>Choose up to 10 clear pictures. JPG, PNG, or WebP; 8 MB maximum each.</p><div className="admin-upload-box"><label className="admin-upload-button"><ImagePlus size={20}/> Choose pictures<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={event=>{stageFiles(event.target.files);event.target.value=''}}/></label><div className="admin-image-grid">{gallery.map((src,index)=><div className="admin-image-thumb" key={`${src}-${index}`}><img src={src} alt={`Fabric photo ${index+1}`}/><button type="button" onClick={()=>setGallery(current=>current.filter((_,i)=>i!==index))} aria-label="Remove photo"><X size={15}/></button></div>)}{files.map((item,index)=><div className="admin-image-thumb" key={item.preview}><img src={item.preview} alt={item.file.name}/><button type="button" onClick={()=>setFiles(current=>current.filter((_,i)=>i!==index))} aria-label="Remove photo"><X size={15}/></button></div>)}{gallery.length+files.length===0&&<span className="admin-no-images">Your pictures will appear here.</span>}</div><small className="admin-image-count">{gallery.length+files.length} of 10 pictures</small></div></div></section>
            <section className="admin-form-step"><span className="admin-step-number">4</span><div className="admin-step-content"><h3>Choose where it shows</h3><p>These switches are optional. You can change them any time.</p><div className="admin-switches"><label><input type="checkbox" name="is_active" defaultChecked={editing?.is_active??true}/><span><strong>Show it in my shop</strong><small>Customers can see it and order it</small></span></label><label><input type="checkbox" name="is_featured" defaultChecked={editing?.is_featured??false}/><span><strong>Show it near the top</strong><small>Feature it on the home page</small></span></label><label><input type="checkbox" name="is_new" defaultChecked={editing?.is_new??false}/><span><strong>It is new</strong><small>Show it with the new fabrics</small></span></label></div><details className="admin-more-settings"><summary>More settings <ChevronDown size={17}/></summary><div className="admin-fields-grid"><label>Small label on the picture<input name="badge" defaultValue={editing?.badge||''} placeholder="Optional · e.g. Best seller" maxLength={40}/></label><label>Display order <small>smaller number shows first</small><input name="sort_order" type="number" defaultValue={editing?.sort_order??100}/></label><label>Customer rating <small>out of 5</small><input name="rating" type="number" min="0" max="5" step="0.1" defaultValue={editing?.rating??4.8}/></label></div></details></div></section>
            <div className="admin-form-footer"><span>Your changes go straight to your online shop.</span><button className="admin-save-button" disabled={saving}>{saving?<><LoaderCircle className="spin" size={20}/> Saving…</>:<><Check size={20}/>{editing?'Save my changes':'Add fabric to my shop'}</>}</button></div>
          </form>
        </section>}

        <section className="admin-inventory" id="inventory"><div className="admin-inventory-heading"><div><span className="admin-kicker">YOUR FABRICS</span><h2>Products</h2><p>Tap a fabric to change its details.</p></div><button className="admin-refresh-button" onClick={()=>void refresh()} aria-label="Refresh product list"><RefreshCw size={18}/><span>Refresh</span></button></div><div className="admin-list-controls"><label className="admin-search"><Search size={20}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Find a fabric by name"/></label><select value={category} onChange={event=>setCategory(event.target.value)} aria-label="Choose a collection"><option value="all">All collections</option>{categories.map(item=><option key={item} value={item}>{item.charAt(0).toUpperCase()+item.slice(1)}</option>)}</select></div>{message&&<div className="admin-message" role="status">{message}<button onClick={()=>setMessage('')} aria-label="Dismiss message"><X size={16}/></button></div>}
          <div className="admin-product-list">{visible.length?visible.map(product=><article className="admin-inventory-card" key={product.id}><img className="admin-inventory-photo" src={product.image_url} alt=""/><div className="admin-inventory-details"><strong>{product.name}</strong><span>{product.category} <i>·</i> {price(product.price)} per metre{product.discount_percent>0&&<em>{product.discount_percent}% off</em>}</span><small>{product.is_featured?'Near the top':'Regular spot'} <i>·</i> {product.stock_meters} metres <i>·</i> {product.is_active?'In shop':'Hidden'}</small></div><div className="admin-inventory-actions"><button className="admin-icon-action" onClick={()=>void toggleVisibility(product)} aria-label={product.is_active?'Hide from shop':'Show in shop'} title={product.is_active?'Hide from shop':'Show in shop'}>{product.is_active?<><EyeOff size={18}/><span>Hide</span></>:<><Eye size={18}/><span>Show</span></>}</button><button className="admin-edit-action" onClick={()=>beginEdit(product)}><Pencil size={17}/><span>Change</span></button></div></article>):<div className="admin-empty-state"><span className="admin-empty-icon"><Boxes size={28}/></span><strong>No fabrics here yet</strong><span>{query?'Try another name or clear your search.':'Add your first fabric and it will show up here.'}</span>{!query&&<button className="admin-add-button" onClick={beginAdd}><Plus size={20}/> Add my first fabric</button>}</div>}</div>
        </section>
      </section>
    </div>}
    {message&&isAdmin&&<div className="admin-toast" role="status">{message}<button onClick={()=>setMessage('')} aria-label="Dismiss message"><X size={15}/></button></div>}
  </main>;
}
