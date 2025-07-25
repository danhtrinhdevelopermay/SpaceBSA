import { useEffect } from 'react';

interface SEOHeadProps {
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
  canonical?: string;
  noIndex?: boolean;
  structuredData?: object;
}

export default function SEOHead({
  title,
  description,
  keywords,
  ogImage = '/logo.png',
  canonical,
  noIndex = false,
  structuredData
}: SEOHeadProps) {
  useEffect(() => {
    // Update page title
    document.title = title;

    // Create or update meta tags
    const updateMetaTag = (name: string, content: string, property?: boolean) => {
      const attr = property ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attr, name);
        document.head.appendChild(meta);
      }
      
      meta.setAttribute('content', content);
    };

    // Basic SEO meta tags
    updateMetaTag('description', description);
    updateMetaTag('author', 'SpaceBSA Team');
    updateMetaTag('language', 'vi-VN');
    updateMetaTag('viewport', 'width=device-width, initial-scale=1.0');
    
    // Update keywords if provided
    if (keywords) {
      updateMetaTag('keywords', keywords);
    }

    // Update robots meta tag
    updateMetaTag('robots', noIndex ? 'noindex, nofollow' : 'index, follow');

    // Open Graph tags for social media
    updateMetaTag('og:type', 'website', true);
    updateMetaTag('og:site_name', 'SpaceBSA', true);
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:image', window.location.origin + ogImage, true);
    updateMetaTag('og:image:alt', 'SpaceBSA - Cloud Storage Platform', true);
    updateMetaTag('og:url', window.location.href, true);
    updateMetaTag('og:locale', 'vi_VN', true);

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image', true);
    updateMetaTag('twitter:site', '@SpaceBSA', true);
    updateMetaTag('twitter:title', title, true);
    updateMetaTag('twitter:description', description, true);
    updateMetaTag('twitter:image', window.location.origin + ogImage, true);
    updateMetaTag('twitter:image:alt', 'SpaceBSA Logo', true);

    // Additional meta tags for better SEO
    updateMetaTag('theme-color', '#3B82F6');
    updateMetaTag('msapplication-TileColor', '#3B82F6');
    updateMetaTag('apple-mobile-web-app-capable', 'yes');
    updateMetaTag('apple-mobile-web-app-status-bar-style', 'default');

    // Update canonical URL if provided
    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', window.location.origin + canonical);
    }

    // Add structured data (JSON-LD) if provided
    if (structuredData) {
      let script = document.querySelector('script[type="application/ld+json"]') as HTMLScriptElement;
      if (!script) {
        script = document.createElement('script');
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(structuredData);
    }

    // Clean up function
    return () => {
      // No cleanup needed as meta tags should persist
    };
  }, [title, description, keywords, ogImage, canonical, noIndex, structuredData]);

  return null;
}