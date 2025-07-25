import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Cloud, Shield, Zap, Users, FileText, Image, Video, Music, Globe, Star, ArrowRight, Check } from "lucide-react";
import SEOHead from "@/components/SEOHead";

export default function LandingPage() {
  const features = [
    {
      icon: <Cloud className="h-8 w-8" />,
      title: "Lưu trữ đám mây",
      description: "Lưu trữ an toàn với Cloudinary và hệ thống dự phòng thông minh"
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Bảo mật tuyệt đối",
      description: "Mã hóa end-to-end và xác thực Firebase bảo vệ dữ liệu của bạn"
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Chia sẻ dễ dàng",
      description: "Chia sẻ file với bạn bè qua email và nhận thông báo ngay lập tức"
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Tốc độ cao",
      description: "Tải lên và tải xuống siêu nhanh với hệ thống cache thông minh"
    }
  ];

  const fileTypes = [
    { icon: <Image className="h-6 w-6" />, name: "Hình ảnh", count: "JPG, PNG, GIF, SVG" },
    { icon: <Video className="h-6 w-6" />, name: "Video", count: "MP4, AVI, MOV, MKV" },
    { icon: <FileText className="h-6 w-6" />, name: "Tài liệu", count: "PDF, DOC, TXT, PPT" },
    { icon: <Music className="h-6 w-6" />, name: "Âm thanh", count: "MP3, WAV, FLAC, OGG" },
  ];

  const plan = {
    name: "Miễn phí",
    price: "0đ",
    period: "mãi mãi",
    features: [
      "1GB lưu trữ",
      "Chia sẻ file không giới hạn",
      "Hỗ trợ cộng đồng",
      "Tất cả định dạng file",
      "Bảo mật cao cấp",
      "Tốc độ tải nhanh"
    ]
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "SpaceBSA",
    "description": "Nền tảng chia sẻ tệp và lưu trữ đám mây miễn phí với bảo mật cao và giao diện hiện đại",
    "url": "https://spacebsa.replit.app",
    "applicationCategory": "ProductivityApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "VND",
      "category": "Free"
    },
    "featureList": [
      "Lưu trữ đám mây 1GB miễn phí",
      "Chia sẻ file không giới hạn", 
      "Bảo mật end-to-end",
      "Giao diện tiếng Việt",
      "Hỗ trợ mọi định dạng file"
    ],
    "screenshot": "https://spacebsa.replit.app/logo.png",
    "publisher": {
      "@type": "Organization",
      "name": "SpaceBSA Team"
    }
  };

  return (
    <>
      <SEOHead
        title="SpaceBSA - Chia sẻ tệp an toàn và lưu trữ đám mây miễn phí"
        description="SpaceBSA cung cấp dịch vụ chia sẻ tệp và lưu trữ đám mây hoàn toàn miễn phí với 1GB dung lượng. Giao diện hiện đại, bảo mật cao, hỗ trợ tiếng Việt."
        keywords="chia sẻ tệp, lưu trữ đám mây, cloud storage, file sharing, miễn phí, SpaceBSA, Vietnam, tải file, chia sẻ an toàn"
        canonical="/"
        structuredData={structuredData}
      />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img src="/logo.png" alt="SpaceBSA" className="h-8 w-8" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                SpaceBSA
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Tính năng</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Giá cả</a>
              <a href="#about" className="text-gray-600 hover:text-gray-900 transition-colors">Về chúng tôi</a>
              <Link href="/auth">
                <Button variant="outline" className="mr-2">Đăng nhập</Button>
              </Link>
              <Link href="/auth">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  Bắt đầu ngay
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <Badge variant="secondary" className="mb-8 bg-blue-100 text-blue-700 border-blue-200">
            <Star className="h-4 w-4 mr-1" />
            Nền tảng chia sẻ file #1 Việt Nam
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-8 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
            Chia sẻ file
            <br />
            <span className="text-gray-900">dễ dàng, an toàn</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            SpaceBSA là nền tảng chia sẻ và lưu trữ file hàng đầu với công nghệ đám mây tiên tiến, 
            bảo mật tuyệt đối và tốc độ lightning-fast. Trải nghiệm chia sẻ file không giới hạn.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-16">
            <Link href="/auth">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-4 h-auto">
                Khởi tạo miễn phí
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="text-lg px-8 py-4 h-auto">
              <Globe className="mr-2 h-5 w-5" />
              Xem demo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">1M+</div>
              <div className="text-gray-600">File được chia sẻ</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">50K+</div>
              <div className="text-gray-600">Người dùng tin tưởng</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-pink-600 mb-2">99.9%</div>
              <div className="text-gray-600">Thời gian hoạt động</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-gray-900">Tính năng nổi bật</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Được thiết kế để đáp ứng mọi nhu cầu chia sẻ file của bạn với công nghệ tiên tiến nhất
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow border-0 bg-white/70 backdrop-blur">
                <CardHeader>
                  <div className="mx-auto mb-4 p-3 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full w-fit text-blue-600">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* File Types */}
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold mb-8 text-gray-900">Hỗ trợ mọi loại file</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {fileTypes.map((type, index) => (
                <Card key={index} className="p-6 hover:shadow-md transition-shadow border-0 bg-white/70">
                  <div className="flex flex-col items-center">
                    <div className="p-3 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full mb-3 text-blue-600">
                      {type.icon}
                    </div>
                    <h4 className="font-semibold mb-1">{type.name}</h4>
                    <p className="text-sm text-gray-500">{type.count}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-gray-900">Hoàn toàn miễn phí</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              SpaceBSA cung cấp tất cả tính năng cao cấp hoàn toàn miễn phí. Không có phí ẩn, không có gói trả phí.
            </p>
          </div>
          
          <div className="flex justify-center">
            <Card className="relative border-2 border-blue-500 shadow-xl max-w-md w-full bg-white/70">
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500">
                100% Miễn phí
              </Badge>
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-blue-600">{plan.price}</span>
                  <span className="text-gray-600">/{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {plan.features.map((feature: string, featureIndex: number) => (
                  <div key={featureIndex} className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
                <Link href="/auth">
                  <Button className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    Bắt đầu miễn phí ngay
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl font-bold mb-6">Sẵn sàng bắt đầu chưa?</h2>
          <p className="text-xl mb-8 opacity-90">
            Tham gia cùng hàng nghìn người dùng đang tin tưởng SpaceBSA cho nhu cầu chia sẻ file
          </p>
          <Link href="/auth">
            <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4 h-auto">
              Tạo tài khoản miễn phí
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img src="/logo.png" alt="SpaceBSA" className="h-8 w-8" />
            <span className="text-xl font-bold">SpaceBSA</span>
          </div>
          <p className="text-gray-400 mb-8">
            Nền tảng chia sẻ file hoàn toàn miễn phí với công nghệ cloud tiên tiến.
          </p>
          <div className="border-t border-gray-800 pt-8">
            <p className="text-gray-400">&copy; 2025 SpaceBSA. Bản quyền bởi Bright Starts Academy BSA</p>
          </div>
        </div>
      </footer>
      </div>
    </>
  );
}