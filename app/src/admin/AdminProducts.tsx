import { useEffect, useState, useRef } from 'react'
import { Plus, Minus, Pencil, Trash2, X, Upload, LayoutGrid, List, Search, Filter, ChevronRight, ChevronLeft, Package, Image as ImageIcon, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { CATEGORY_LIST, CATEGORY_CONFIG, RitualCategorySlug } from '@/constants/categories'
import { getCloudinaryFolder, getThumbnailImage, getProductImage } from '@/lib/cloudinary'
import { trpc } from '@/providers/trpc'


type ProductForm = {
  id?: string
  name: string
  slug: string
  description: string
  ingredients: string
  how_to_use: string
  category: string
  images: string[]
  rating: number
  gst_rate: number
  hsn_code: string
  variants: Array<{ id?: string; size_label: string; price: number; sku: string; stock: number }>
}

const emptyForm: ProductForm = {
  name: '',
  slug: '',
  description: '',
  ingredients: '',
  how_to_use: '',
  category: 'hair-rituals',
  images: [],
  rating: 4.5,
  gst_rate: 18,
  hsn_code: '33051090',
  variants: [{ size_label: '', price: 0, sku: '', stock: 0 }],
}


export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<ProductForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const signUploadMutation = trpc.cloudinary.signUpload.useMutation()

  useEffect(() => {
    fetchProducts()
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setViewMode('grid')
    }
  }, [])

  async function fetchProducts() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`*, product_variants(*)`)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      await processFiles(files)
    }
  }

  async function processFiles(files: FileList) {
    const validFiles: File[] = []
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const ext = file.name.split('.').pop()?.toLowerCase() || ''
      if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
        toast.error(`"${file.name}" has an unsupported format. Use JPG, PNG or WebP.`)
        continue
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error(`"${file.name}" exceeds the 10MB size limit.`)
        continue
      }
      validFiles.push(file)
    }

    if (validFiles.length === 0) return

    setUploading(true)
    
    const uploadPromises = validFiles.map(async (file) => {
      const tempId = crypto.randomUUID()
      setUploadProgress(prev => ({ ...prev, [tempId]: 0 }))

      try {
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'rootsandleaves';
        const folder = getCloudinaryFolder(form.category);
        
        // Fetch signature from backend
        const signData = await signUploadMutation.mutateAsync({ folder });
        
        if (!signData.success || !signData.signature || !signData.timestamp || !signData.apiKey) {
          throw new Error(signData.error || 'Failed to generate upload signature');
        }

        const secureUrl = await new Promise<string>((resolve, reject) => {
          const xhr = new XMLHttpRequest()
          xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, true)

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const percent = Math.round((e.loaded / e.total) * 100)
              setUploadProgress(prev => ({ ...prev, [tempId]: percent }))
            }
          }

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const response = JSON.parse(xhr.responseText)
                resolve(response.secure_url)
              } catch (err) {
                reject(new Error('Failed to parse Cloudinary response'))
              }
            } else {
              try {
                const errRes = JSON.parse(xhr.responseText)
                reject(new Error(errRes.error?.message || 'Upload failed'))
              } catch (e) {
                reject(new Error('Upload failed'))
              }
            }
          }

          xhr.onerror = () => reject(new Error('Network error during upload'))

          const formData = new FormData()
          formData.append('file', file)
          formData.append('folder', folder)
          formData.append('api_key', signData.apiKey)
          formData.append('timestamp', signData.timestamp.toString())
          formData.append('signature', signData.signature)

          xhr.send(formData)
        })

        setUploadProgress(prev => {
          const next = { ...prev }
          delete next[tempId]
          return next
        })
        return secureUrl
      } catch (err: any) {
        console.error('File upload error:', err)
        setUploadProgress(prev => {
          const next = { ...prev }
          delete next[tempId]
          return next
        })
        toast.error(`Failed to upload ${file.name}: ${err.message}`)
        return null
      }
    })

    try {
      const results = await Promise.all(uploadPromises)
      const successfulUrls = results.filter((url): url is string => url !== null)
      
      if (successfulUrls.length > 0) {
        setForm((prev) => ({
          ...prev,
          images: [...prev.images, ...successfulUrls]
        }))
        toast.success(`Successfully uploaded ${successfulUrls.length} image(s) to Cloudinary.`)
      }
    } catch (globalErr: any) {
      console.error('Global upload handling failed:', globalErr)
      toast.error('An error occurred during image uploads.')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return
    await processFiles(files)
  }

  function moveImage(index: number, direction: 'left' | 'right') {
    const newImages = [...form.images]
    const targetIndex = direction === 'left' ? index - 1 : index + 1
    
    if (targetIndex < 0 || targetIndex >= newImages.length) return
    
    const temp = newImages[index]
    newImages[index] = newImages[targetIndex]
    newImages[targetIndex] = temp
    
    setForm(prev => ({ ...prev, images: newImages }))
  }


  function generateSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  }

  async function handleSave() {
    if (!form.name || !form.slug) {
      toast.error('Product Name and URL Slug are required')
      return
    }

    const validVariants = form.variants.filter(v => v.size_label && v.price > 0)
    if (validVariants.length === 0) {
      toast.error('At least one size with a valid price is required')
      return
    }

    setSaving(true)

    try {
      const productData: any = {
        name: form.name,
        slug: form.slug || generateSlug(form.name),
        description: form.description || null,
        ingredients: form.ingredients || null,
        how_to_use: form.how_to_use || null,
        category: form.category,
        images: form.images.length > 0 ? form.images : null,
        rating: form.rating,
        gst_rate: form.gst_rate,
        hsn_code: form.hsn_code,
      }

      if (form.id) {
        productData.id = form.id
      }

      const { data, error } = await supabase.from('products').upsert(productData).select('id').single()

      if (error) {
        console.error('Product save error:', error)
        throw new Error(error.message || 'Failed to save product details')
      }

      const productId = data.id
      // Sync form ID after successful save
      setForm(prev => ({ ...prev, id: data.id }))

      if (productId) {
        for (const variant of validVariants) {
          let currentSku = variant.sku;
          try {
            // Auto SKU Generation if empty
            if (!currentSku || currentSku.trim() === '') {
              const prefix = CATEGORY_CONFIG[form.category as RitualCategorySlug]?.skuPrefix || 'NAT';
              try {
                const { data: generatedSku, error: skuError } = await supabase.rpc('get_next_sku', { prefix });

                if (!skuError && generatedSku) {
                  currentSku = generatedSku;
                } else {
                  console.warn('SKU RPC failed, using fallback:', skuError);
                  throw new Error('RPC failed');
                }
              } catch (e) {
                // Fallback if RPC fails or sequence doesn't exist yet
                // Using a timestamp + random to practically guarantee uniqueness
                const timestampPart = Date.now().toString().slice(-4);
                const randomPart = Math.floor(100 + Math.random() * 899);
                const namePart = generateSlug(form.name).substring(0, 3).toUpperCase();
                const sizePart = generateSlug(variant.size_label).substring(0, 2).toUpperCase();
                currentSku = `${prefix}-${namePart}-${sizePart}-${timestampPart}${randomPart}`;
              }
            }

            if (variant.id) {
              const { error: updateErr } = await supabase.from('product_variants').update({
                size_label: variant.size_label,
                price: variant.price,
                sku: currentSku,
                stock: variant.stock,
              }).eq('id', variant.id)
              if (updateErr) throw updateErr;
            } else {
              const { error: insertErr } = await supabase.from('product_variants').insert({
                product_id: productId,
                size_label: variant.size_label,
                price: variant.price,
                sku: currentSku,
                stock: variant.stock,
              })
              if (insertErr) throw insertErr;
            }
          } catch (variantErr: any) {
            console.error('Detailed Variant Error:', variantErr);
            const errorMsg = variantErr.code === '23505'
              ? `SKU conflict: "${currentSku}" is already in use.`
              : (variantErr.message || variantErr.details || `Failed to save variant ${variant.size_label}`);
            throw new Error(errorMsg);
          }
        }
      }

      toast.success(form.id ? 'Product updated successfully' : 'Product created successfully')
      setShowForm(false)
      setForm(emptyForm)
      fetchProducts()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Failed to save product')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) return
    try {
      // 1. Delete variants first to satisfy foreign key constraints
      const { error: variantError } = await supabase
        .from('product_variants')
        .delete()
        .eq('product_id', id)

      if (variantError) throw variantError

      // 2. Delete the product
      const { error: productError } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (productError) throw productError

      toast.success('Product and its variants deleted successfully')
      fetchProducts()
    } catch (err: any) {
      console.error('Delete error:', err)
      toast.error(err.message || 'Failed to delete product')
    }
  }

  function editProduct(product: any) {
    setForm({
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description || '',
      ingredients: product.ingredients || '',
      how_to_use: product.how_to_use || '',
      category: product.category,
      images: product.images || [],
      rating: product.rating || 4.5,
      gst_rate: product.gst_rate ?? 18,
      hsn_code: product.hsn_code ?? '33051090',
      variants: product.product_variants?.length
        ? product.product_variants.map((v: any) => ({
          id: v.id,
          size_label: v.size_label,
          price: v.price,
          sku: v.sku,
          stock: v.stock,
        }))
        : [{ size_label: '', price: 0, sku: '', stock: 0 }],
    })
    setShowForm(true)
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-700">
      {/* Header & Actions */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-serif text-[#4A3525] mb-1">Inventory</h1>
          <p className="text-[#B37943] font-medium tracking-wide uppercase text-[10px]">
            Manage your curated botanical selection
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-[#E5C492] rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-[#FAF9F6] text-[#4A3525]' : 'text-[#B37943] hover:text-[#4A3525]'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-[#FAF9F6] text-[#4A3525]' : 'text-[#B37943] hover:text-[#4A3525]'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => { setForm(emptyForm); setShowForm(true) }}
            className="flex items-center gap-2 px-5 py-3 bg-[#B37943] text-white text-xs font-bold rounded-xl hover:bg-[#8A5D33] transition-all shadow-lg shadow-[#B37943]/10 uppercase tracking-widest"
          >
            <Plus className="w-3.5 h-3.5" /> New Product
          </button>
        </div>
      </header>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B37943] group-focus-within:text-[#4A3525] transition-colors" />
          <input
            type="text"
            placeholder="Search catalog..."
            className="w-full pl-12 pr-5 py-3.5 bg-white border border-[#E5C492] rounded-xl text-xs focus:outline-none focus:ring-4 focus:ring-[#B37943]/5 transition-all shadow-sm"
          />
        </div>
        <button className="flex items-center gap-2 px-5 py-3.5 bg-white border border-[#E5C492] rounded-xl text-xs font-bold text-[#B37943] hover:text-[#4A3525] transition-all uppercase tracking-widest">
          <Filter className="w-3.5 h-3.5" /> Filters
        </button>
      </div>

      {/* Product Display */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-[#B37943] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[#B37943] font-serif italic text-base">Curating catalog...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-[1.5rem] border border-dashed border-[#E5C492]">
          <Package className="w-12 h-12 text-[#E5C492] mx-auto mb-4" />
          <p className="text-xl font-serif text-[#4A3525] mb-1">The shelves are empty</p>
          <p className="text-xs text-[#B37943] mb-6">Start your journey by adding your first botanical creation.</p>
          <button
            onClick={() => { setForm(emptyForm); setShowForm(true) }}
            className="px-6 py-3 bg-[#FAF9F6] text-[#4A3525] font-bold rounded-xl border border-[#E5C492] hover:bg-white transition-all uppercase tracking-widest text-[10px]"
          >
            Initialize Catalog
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <div key={product.id} className="group bg-white rounded-[1.5rem] border border-[#E5C492] overflow-hidden shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-lg)] transition-all duration-500">
              <div className="aspect-square bg-[#FAF9F6] relative overflow-hidden">
                {product.images?.[0] ? (
                  <img
                    src={getProductImage(product.images[0])}
                    alt={product.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#E5C492]">
                    <ImageIcon className="w-10 h-10" />
                  </div>
                )}
                <div className="absolute top-3 right-3 flex gap-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  <a
                    href={`/product/${product.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-9 h-9 bg-white/90 backdrop-blur rounded-lg flex items-center justify-center text-[#4A3525] hover:bg-white shadow-lg"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => editProduct(product)}
                    className="w-9 h-9 bg-white/90 backdrop-blur rounded-lg flex items-center justify-center text-[#4A3525] hover:bg-white shadow-lg"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="w-9 h-9 bg-white/90 backdrop-blur rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 shadow-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="absolute bottom-3 left-3">
                  <span className="text-[9px] font-bold text-[#4A3525] uppercase tracking-widest bg-white/90 backdrop-blur px-2.5 py-1.5 rounded-lg shadow-sm">
                    {CATEGORY_CONFIG[product.category as RitualCategorySlug]?.label || product.category}
                  </span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-serif text-[#4A3525] mb-1.5 truncate group-hover:text-[#B37943] transition-colors">{product.name}</h3>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-[#B37943]">
                    {product.product_variants?.length || 0} Variants
                  </p>
                  <p className="text-base font-serif text-[#4A3525]">
                    ₹{product.product_variants?.[0]?.price || '—'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl sm:rounded-[1.5rem] border border-[#E5C492] overflow-hidden shadow-[var(--shadow-md)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAF9F6]/50 border-b border-[#E5C492]">
                  <th className="px-6 py-4 text-[9px] font-bold text-[#B37943] uppercase tracking-[0.2em]">Product</th>
                  <th className="px-6 py-4 text-[9px] font-bold text-[#B37943] uppercase tracking-[0.2em]">Category</th>
                  <th className="px-6 py-4 text-[9px] font-bold text-[#B37943] uppercase tracking-[0.2em]">Variants</th>
                  <th className="px-6 py-4 text-[9px] font-bold text-[#B37943] uppercase tracking-[0.2em]">Price</th>
                  <th className="px-6 py-4 text-[9px] font-bold text-[#B37943] uppercase tracking-[0.2em]">Status</th>
                  <th className="px-6 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#FAF9F6]">
                {products.map((product) => (
                  <tr key={product.id} className="group hover:bg-[#FAF9F6]/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-[#FAF9F6] rounded-xl overflow-hidden border border-[#E5C492] flex-shrink-0">
                          {product.images?.[0] && (
                            <img src={getThumbnailImage(product.images[0])} alt="" loading="lazy" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-serif text-[#4A3525] group-hover:text-[#B37943] transition-colors">{product.name}</p>
                          <p className="text-[10px] text-[#B37943] font-medium">{product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold text-[#4A3525] uppercase tracking-wider bg-[#FAF9F6] px-2.5 py-1 rounded-lg border border-[#E5C492]">
                        {CATEGORY_CONFIG[product.category as RitualCategorySlug]?.label || product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-semibold text-[#B37943]">{product.product_variants?.length || 0} Sizes</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-serif text-[#4A3525]">₹{product.product_variants?.[0]?.price || '—'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                        <span className="text-[10px] font-bold text-[#B37943] uppercase tracking-widest">Active</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a
                          href={`/product/${product.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 text-[#B37943] hover:text-[#4A3525] hover:bg-white rounded-lg border border-transparent hover:border-[#E5C492] transition-all"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => editProduct(product)}
                          className="p-2 text-[#B37943] hover:text-[#4A3525] hover:bg-white rounded-lg border border-transparent hover:border-[#E5C492] transition-all"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 text-[#B37943] hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-[#B37943] hover:text-[#4A3525] transition-colors">
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-6 lg:p-10 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-[#4A3525]/40 backdrop-blur-md" onClick={() => setShowForm(false)} />

          <div className="relative w-full max-w-5xl bg-white rounded-2xl sm:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh] animate-in zoom-in-95 duration-500 border border-[#E5C492]">
            {/* Modal Header */}
            <div className="p-4 sm:p-8 pb-3 sm:pb-4 flex items-center justify-between bg-white/80 backdrop-blur-sm sticky top-0 z-10 border-b border-[#FAF9F6]">
              <div>
                <h2 className="text-3xl font-serif text-[#4A3525]">{form.id ? 'Refine Product' : 'New Creation'}</h2>
                <p className="text-xs text-[#B37943] font-medium tracking-wide uppercase mt-1">Catalog Entry Management</p>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="w-12 h-12 flex items-center justify-center bg-[#FAF9F6] rounded-2xl text-[#4A3525] hover:bg-[#E5C492] transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 sm:space-y-12">
              {/* Main Info */}
              <div className="grid lg:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <h3 className="text-xs font-bold text-[#4A3525] uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                    <span className="w-8 h-[1px] bg-[#E5C492]" /> Essential Details
                  </h3>

                  <div className="space-y-6">
                    <div className="grid sm:grid-cols-1 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#4A3525] uppercase tracking-widest px-1">Product Name</label>
                        <input
                          value={form.name}
                          onChange={(e) => {
                            const newName = e.target.value;
                            setForm((prev) => ({
                              ...prev,
                              name: newName,
                              slug: prev.id ? prev.slug : generateSlug(newName)
                            }))
                          }}
                          className="w-full px-5 py-4 bg-[#FAF9F6]/50 border border-[#E5C492] rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-[#B37943]/5 transition-all"
                          placeholder="e.g., Hibiscus Revival Oil"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#4A3525] uppercase tracking-widest px-1">Category</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {CATEGORY_LIST.map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => setForm({ ...form, category: cat.id })}
                            className={`py-4 px-2 rounded-2xl border-2 text-xs font-bold uppercase tracking-widest transition-all ${form.category === cat.id
                                ? 'bg-[#4A3525] border-[#4A3525] text-white shadow-lg'
                                : 'bg-white border-[#E5C492] text-[#B37943] hover:border-[#B37943]'
                              }`}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#4A3525] uppercase tracking-widest px-1">Product Rating</label>
                      <div className="flex items-center gap-4">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="5"
                          value={form.rating}
                          onChange={(e) => setForm({ ...form, rating: parseFloat(e.target.value) || 0 })}
                          className="w-32 px-5 py-4 bg-[#FAF9F6]/50 border border-[#E5C492] rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-[#B37943]/5 transition-all"
                        />
                        <div className="flex items-center gap-1 text-[#B37943]">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <svg key={i} className={`w-5 h-5 ${i < Math.floor(form.rating) ? 'fill-current' : 'fill-none stroke-current'}`} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.54 1.118l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.784.57-1.838-.197-1.539-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                          ))}
                          <span className="text-xs font-bold ml-2">5.0 Max</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#4A3525] uppercase tracking-widest px-1">GST Rate (%)</label>
                        <select
                          value={form.gst_rate}
                          onChange={(e) => setForm({ ...form, gst_rate: parseInt(e.target.value) || 0 })}
                          className="w-full px-5 py-4 bg-[#FAF9F6]/50 border border-[#E5C492] rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-[#B37943]/5 transition-all text-[#4A3525] font-medium"
                        >
                          <option value={0}>0% (Tax Exempt)</option>
                          <option value={5}>5% (Ayurvedic Medicines)</option>
                          <option value={12}>12% (Foods/Supplements)</option>
                          <option value={18}>18% (Cosmetics/Luxury)</option>
                          <option value={28}>28% (Luxury items)</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#4A3525] uppercase tracking-widest px-1">HSN Code</label>
                        <input
                          value={form.hsn_code}
                          onChange={(e) => setForm({ ...form, hsn_code: e.target.value })}
                          className="w-full px-5 py-4 bg-[#FAF9F6]/50 border border-[#E5C492] rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-[#B37943]/5 transition-all"
                          placeholder="e.g. 33051090"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#4A3525] uppercase tracking-widest px-1">Description</label>
                      <textarea
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        rows={4}
                        className="w-full px-5 py-4 bg-[#FAF9F6]/50 border border-[#E5C492] rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-[#B37943]/5 transition-all resize-none"
                        placeholder="Craft a compelling story for this product..."
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-xs font-bold text-[#4A3525] uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                    <span className="w-8 h-[1px] bg-[#E5C492]" /> Visual Assets
                  </h3>

                  {/* Drag and Drop Dropzone */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl sm:rounded-[2rem] p-4 sm:p-8 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center min-h-[160px] sm:min-h-[200px] ${
                      isDragging
                        ? 'border-[#B37943] bg-[#B37943]/5 scale-[0.98]'
                        : 'border-[#E5C492] bg-[#FAF9F6]/50 hover:bg-[#FAF9F6] hover:border-[#B37943]'
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileRef}
                      onChange={handleImageUpload}
                      multiple
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      className="hidden"
                    />
                    <Upload className={`w-10 h-10 mb-4 transition-transform duration-500 ${uploading ? 'animate-bounce text-[#B37943]' : 'text-[#E5C492]'}`} />
                    <p className="text-sm font-serif text-[#4A3525] mb-1">
                      {uploading ? 'Whispering to Cloudinary...' : 'Select or drag botanical assets'}
                    </p>
                    <p className="text-[10px] text-[#B37943] font-medium tracking-wide uppercase">
                      Supports JPG, PNG, WebP up to 10MB
                    </p>
                  </div>

                  {/* Image Grid with Previews, Progress, & Controls */}
                  {(form.images.length > 0 || Object.keys(uploadProgress).length > 0) && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
                      {/* Active Uploading Previews */}
                      {Object.entries(uploadProgress).map(([id, progress]) => (
                        <div key={id} className="aspect-square rounded-2xl bg-[#FAF9F6] border border-[#E5C492] p-4 flex flex-col items-center justify-center relative overflow-hidden text-center">
                          <div className="w-8 h-8 border-4 border-[#B37943]/30 border-t-[#B37943] rounded-full animate-spin mb-2" />
                          <span className="text-[10px] font-bold text-[#B37943] tracking-widest">{progress}%</span>
                          <div className="absolute bottom-0 left-0 h-1 bg-[#B37943] transition-all duration-300" style={{ width: `${progress}%` }} />
                        </div>
                      ))}

                      {/* Uploaded Image Cards */}
                      {form.images.map((img, i) => (
                        <div key={img} className="aspect-square rounded-2xl bg-[#FAF9F6] border border-[#E5C492] overflow-hidden relative group">
                          <img
                            src={getThumbnailImage(img)}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                          {/* Hover Actions */}
                          <div className="absolute inset-0 bg-[#4A3525]/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); moveImage(i, 'left'); }}
                              disabled={i === 0}
                              className="w-8 h-8 rounded-lg bg-white/95 text-[#4A3525] hover:bg-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); moveImage(i, 'right'); }}
                              disabled={i === form.images.length - 1}
                              className="w-8 h-8 rounded-lg bg-white/95 text-[#4A3525] hover:bg-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setForm(prev => ({
                                  ...prev,
                                  images: prev.images.filter((_, idx) => idx !== i)
                                }));
                              }}
                              className="w-8 h-8 rounded-lg bg-red-500 text-white hover:bg-red-600 flex items-center justify-center transition-all"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          {/* Image Number Badge */}
                          <div className="absolute top-2 left-2 bg-[#4A3525]/85 text-white font-mono text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                            {i + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Composition & Usage */}
              <div className="grid lg:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <label className="text-xs font-bold text-[#4A3525] uppercase tracking-widest px-1">Botanical Ingredients</label>
                  <textarea
                    value={form.ingredients}
                    onChange={(e) => setForm({ ...form, ingredients: e.target.value })}
                    rows={3}
                    className="w-full px-5 py-4 bg-[#FAF9F6]/50 border border-[#E5C492] rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-[#B37943]/5 transition-all resize-none"
                    placeholder="List the natural elements..."
                  />
                </div>
                <div className="space-y-6">
                  <label className="text-xs font-bold text-[#4A3525] uppercase tracking-widest px-1">Ritual & Usage</label>
                  <textarea
                    value={form.how_to_use}
                    onChange={(e) => setForm({ ...form, how_to_use: e.target.value })}
                    rows={3}
                    className="w-full px-5 py-4 bg-[#FAF9F6]/50 border border-[#E5C492] rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-[#B37943]/5 transition-all resize-none"
                    placeholder="Describe the application process..."
                  />
                </div>
              </div>

              {/* Variants Section */}
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#4A3525] uppercase tracking-[0.2em] flex items-center gap-3">
                    <span className="w-8 h-[1px] bg-[#E5C492]" /> Sizing & Pricing
                  </h3>
                  <button
                    onClick={() => setForm({ ...form, variants: [...form.variants, { size_label: '', price: 0, sku: '', stock: 0 }] })}
                    className="px-4 py-2 bg-[#FAF9F6] text-[#4A3525] text-[10px] font-bold uppercase tracking-widest rounded-xl border border-[#E5C492] hover:bg-white transition-all"
                  >
                    + Add Size
                  </button>
                </div>

                <div className="space-y-4">
                  {form.variants.map((variant, i) => (
                    <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 p-4 sm:p-6 bg-[#FAF9F6]/30 rounded-2xl sm:rounded-[2rem] border border-[#E5C492] relative group">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[#B37943] uppercase tracking-widest px-1">Size Label</label>
                        <input
                          placeholder="100ml / 500g"
                          value={variant.size_label}
                          onChange={(e) => {
                            const v = [...form.variants]; v[i].size_label = e.target.value; setForm({ ...form, variants: v })
                          }}
                          className="w-full px-5 py-4 bg-white border border-[#E5C492] rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-[#B37943]/5 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[#B37943] uppercase tracking-widest px-1">Price (₹)</label>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={variant.price || ''}
                          onChange={(e) => {
                            const v = [...form.variants]; v[i].price = parseInt(e.target.value) || 0; setForm({ ...form, variants: v })
                          }}
                          className="w-full px-5 py-4 bg-white border border-[#E5C492] rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-[#B37943]/5 transition-all"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={() => setForm({ ...form, variants: form.variants.filter((_, idx) => idx !== i) })}
                          disabled={form.variants.length === 1}
                          className="w-full py-4 text-[#B37943] hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all disabled:opacity-30 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest border border-transparent hover:border-red-100"
                        >
                          <Trash2 className="w-4 h-4" /> Remove Size
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-8 bg-[#FAF9F6]/50 backdrop-blur-sm border-t border-[#E5C492] flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-5 bg-[#4A3525] text-white font-bold rounded-2xl hover:bg-[#2d2a26] transition-all shadow-xl shadow-[#4A3525]/20 disabled:opacity-50 uppercase tracking-[0.2em] text-xs"
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-3">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Synchronizing...
                  </span>
                ) : 'Confirm and Publish'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-12 py-5 bg-white text-[#B37943] font-bold rounded-2xl border border-[#E5C492] hover:text-[#4A3525] transition-all uppercase tracking-[0.2em] text-xs"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
