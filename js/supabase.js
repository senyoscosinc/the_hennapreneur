// Supabase helper for henna data
// Lazy-load the client to ensure window.CONFIG contains Supabase credentials
let supabaseClient = null;

function initSupabaseClient() {
  const supabaseUrl = window.CONFIG?.SUPABASE_URL || window.SUPABASE_URL;
  const supabaseAnonKey = window.CONFIG?.SUPABASE_ANON_KEY || window.SUPABASE_ANON_KEY;

  if (!supabaseClient && supabaseUrl && supabaseAnonKey) {
    supabaseClient = supabase.createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseClient;
}

async function getHennaImageUrl(imagePath) {
  initSupabaseClient();
  if (!supabaseClient) {
    console.warn('Image URL: Supabase client not initialized, returning path as-is:', imagePath);
    return imagePath || '';
  }

  const hennaBucket = window.CONFIG?.HENNA_BUCKET || window.HENNA_BUCKET;
  if (!hennaBucket) {
    console.warn('Image URL: HENNA_BUCKET not configured, returning path as-is:', imagePath);
    return imagePath || '';
  }

  if (!imagePath) {
    console.warn('Image URL: imagePath is empty');
    return '';
  }

  try {
    const { data, error } = supabaseClient.storage
      .from(hennaBucket)
      .getPublicUrl(imagePath);

    if (error) {
      console.error('Image URL: Storage error for', imagePath, ':', error);
      return imagePath; // Return original path on error
    }

    const publicUrl = data?.publicUrl;
    return publicUrl || imagePath;
  } catch (err) {
    console.error('Image URL: Exception while getting URL:', err, 'returning original:', imagePath);
    return imagePath;
  }
}

async function fetchHennaDesignsFromSupabase() {
  initSupabaseClient();
  if (!supabaseClient) {
    console.warn('Supabase is not configured. Falling back to local data.');
    return null;
  }

  const { data: rows, error } = await supabaseClient
    .from('henna_designs')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    console.error('Supabase fetch error:', error);
    return null;
  }

  return rows.map(row => ({
    id: row.id,
    category: row.category || 'Henna',
    name: row.name,
    description: row.description,
    variation1_name: row.variation1_name || 'Option 1',
    variation1_price: Number(row.variation1_price) || 0,
    variation2_name: row.variation2_name || 'Option 2',
    variation2_price: Number(row.variation2_price) || 0,
    image: row.image_path || '',
    date_created: row.date_created || row.created_at || '',
    featured: row.featured || false
  }));
}

async function fetchProductsFromSupabase() {
  initSupabaseClient();
  if (!supabaseClient) {
    console.warn('Products fetch: Supabase client not initialized.');
    return null;
  }

  const { data: rows, error } = await supabaseClient
    .from('products_table')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    console.error('Supabase products_table fetch error:', error);
    return null;
  }

  const mapped = rows.map(row => ({
    id: row?.id,
    name: row?.name || 'Unnamed Product',
    description: row?.description || '',
    category: row?.category || 'Uncategorized',
    image: row?.image_url || row?.image || '',
    images: Array.isArray(row?.image_gallery) ? row.image_gallery : (Array.isArray(row?.images) ? row.images : []),
    featured: Boolean(row?.featured) && row?.featured !== 'false' && row?.featured !== 0,
    pricing: {
      single: Number(row?.price_single) || Number(row?.price) || 0,
      packOf12: Number(row?.price_pack_of_12) || 0,
      bulkPack: Number(row?.price_bulk_pack) || 0
    },
    price: Number(row?.price_single) || Number(row?.price) || 0,
    metadata: row?.metadata || null,
    created_at: row?.created_at || null,
    updated_at: row?.updated_at || null
  }));

  return mapped;
}

async function saveCheckoutOrder(orderData) {
  initSupabaseClient();
  if (!supabaseClient) {
    console.warn('saveCheckoutOrder: Supabase client not initialized.');
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabaseClient
      .from('checkout_orders_public')
      .insert({
        customer_name: orderData.customer_name,
        customer_email: orderData.customer_email,
        customer_phone: orderData.customer_phone,
        delivery_address: orderData.delivery_address || null,
        service_type: orderData.service_type || null,
        payment_method: orderData.payment_method || null,
        payment_reference: orderData.payment_reference || null,
        order_items: orderData.order_items,
        order_total: orderData.order_total,
        status: orderData.status || 'pending',
        notes: orderData.notes || null
      });

    if (error) {
      console.error('saveCheckoutOrder: Supabase insert error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('saveCheckoutOrder: Exception:', err);
    return { success: false, error: err.message };
  }
}