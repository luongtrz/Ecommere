import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
}

const DEFAULT_SEO = {
  title: 'Shop Chai Xịt Thái Lan - Chất lượng cao, giá tốt nhất',
  description: 'Cung cấp chai xịt Thái Lan chính hãng với đa dạng mùi hương và dung tích. Giao hàng nhanh, giá tốt nhất thị trường.',
  keywords: 'chai xịt, thái lan, nước hoa, khử mùi, spray thailand',
  image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=1200&h=630&fit=crop',
  url: 'https://thaisprayshop.com',
};

export function SEO({ 
  title, 
  description, 
  keywords, 
  image, 
  url 
}: SEOProps) {
  const seo = {
    title: title ? `${title} | Thai Spray Shop` : DEFAULT_SEO.title,
    description: description || DEFAULT_SEO.description,
    keywords: keywords || DEFAULT_SEO.keywords,
    image: image || DEFAULT_SEO.image,
    url: url || DEFAULT_SEO.url,
  };

  return (
    <Helmet>
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />
      <meta name="keywords" content={seo.keywords} />
      
      {/* Open Graph */}
      <meta property="og:title" content={seo.title} />
      <meta property="og:description" content={seo.description} />
      <meta property="og:image" content={seo.image} />
      <meta property="og:url" content={seo.url} />
      <meta property="og:type" content="website" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seo.title} />
      <meta name="twitter:description" content={seo.description} />
      <meta name="twitter:image" content={seo.image} />
    </Helmet>
  );
}
