import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Sun, Moon, Sunrise, Sunset, Coffee, Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface PersonalizedWelcomeProps {
  onDismiss: () => void;
}

export default function PersonalizedWelcome({ onDismiss }: PersonalizedWelcomeProps) {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Get time-based greeting and icon
  const getTimeBasedGreeting = () => {
    const hour = currentTime.getHours();
    
    if (hour >= 5 && hour < 12) {
      return {
        greeting: "Chào buổi sáng",
        icon: <Sunrise className="h-6 w-6 text-orange-500" />,
        bgGradient: "from-orange-100 to-yellow-100",
        textColor: "text-orange-700"
      };
    } else if (hour >= 12 && hour < 17) {
      return {
        greeting: "Chào buổi chiều", 
        icon: <Sun className="h-6 w-6 text-yellow-500" />,
        bgGradient: "from-yellow-100 to-orange-100",
        textColor: "text-yellow-700"
      };
    } else if (hour >= 17 && hour < 21) {
      return {
        greeting: "Chào buổi tối",
        icon: <Sunset className="h-6 w-6 text-purple-500" />,
        bgGradient: "from-purple-100 to-pink-100", 
        textColor: "text-purple-700"
      };
    } else {
      return {
        greeting: "Chào đêm muộn",
        icon: <Moon className="h-6 w-6 text-blue-500" />,
        bgGradient: "from-blue-100 to-indigo-100",
        textColor: "text-blue-700"
      };
    }
  };

  // Get additional time-based message
  const getTimeBasedMessage = () => {
    const hour = currentTime.getHours();
    
    if (hour >= 5 && hour < 9) {
      return "Bắt đầu ngày mới với năng lượng tích cực! ☕";
    } else if (hour >= 9 && hour < 12) {
      return "Chúc bạn một buổi sáng làm việc hiệu quả! 💪";
    } else if (hour >= 12 && hour < 14) {
      return "Đã đến giờ nghỉ trưa rồi! Hãy nạp năng lượng nhé! 🍽️";
    } else if (hour >= 14 && hour < 17) {
      return "Buổi chiều làm việc tràn đầy động lực! 🚀";
    } else if (hour >= 17 && hour < 21) {
      return "Thời gian thư giãn sau một ngày làm việc! 🌅";
    } else if (hour >= 21 && hour < 24) {
      return "Chúc bạn một buổi tối thư thái! 🌙";
    } else {
      return "Thức khuya à? Hãy chăm sóc sức khỏe nhé! 💤";
    }
  };

  // Get personalized first name
  const getFirstName = () => {
    if (!user?.displayName) return "bạn";
    
    const names = user.displayName.trim().split(' ');
    return names[0] || "bạn";
  };

  // Format current time
  const formatTime = () => {
    return currentTime.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Format current date
  const formatDate = () => {
    return currentTime.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const timeData = getTimeBasedGreeting();
  const firstName = getFirstName();

  return (
    <Card className={`w-full bg-gradient-to-r ${timeData.bgGradient} border-0 shadow-lg mb-6 relative overflow-hidden`}>
      {/* Background decoration */}
      <div className="absolute top-0 right-0 opacity-10">
        <div className="w-32 h-32 rounded-full bg-white transform translate-x-8 -translate-y-8"></div>
      </div>
      <div className="absolute bottom-0 left-0 opacity-10">
        <div className="w-24 h-24 rounded-full bg-white transform -translate-x-6 translate-y-6"></div>
      </div>
      
      {/* Close button */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 h-8 w-8 p-0 hover:bg-white/20"
        onClick={onDismiss}
      >
        <X className="h-4 w-4" />
      </Button>

      <CardContent className="p-6 relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Time-based greeting */}
            <div className="flex items-center space-x-3 mb-3">
              {timeData.icon}
              <h2 className={`text-2xl font-bold ${timeData.textColor}`}>
                {timeData.greeting}, {firstName}!
              </h2>
            </div>
            
            {/* Current time and date */}
            <div className={`text-sm ${timeData.textColor} opacity-80 mb-3`}>
              <div className="flex items-center space-x-4">
                <span className="font-medium">{formatTime()}</span>
                <span>•</span>
                <span>{formatDate()}</span>
              </div>
            </div>
            
            {/* Time-based message */}
            <p className={`text-lg ${timeData.textColor} opacity-90 mb-4`}>
              {getTimeBasedMessage()}
            </p>
            
            {/* Quick stats or tip */}
            <div className={`text-sm ${timeData.textColor} opacity-75`}>
              <div className="flex items-center space-x-2">
                <Star className="h-4 w-4" />
                <span>Hôm nay bạn muốn quản lý files như thế nào?</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}