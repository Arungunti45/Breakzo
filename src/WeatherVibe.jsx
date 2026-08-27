import React, { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, Snowflake, Wind, Thermometer } from 'lucide-react';

function WeatherVibe() {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    // Simulate weather data (replace with real API like OpenWeatherMap if desired)
    const hour = new Date().getHours();
    const conditions = [
      { temp: 35, condition: 'sunny', humidity: 40 },
      { temp: 28, condition: 'cloudy', humidity: 65 },
      { temp: 22, condition: 'rainy', humidity: 80 },
      { temp: 15, condition: 'cold', humidity: 50 },
    ];
    // Pick based on time of day for variety
    const idx = hour < 10 ? 3 : hour < 14 ? 0 : hour < 18 ? 1 : 2;
    setWeather(conditions[idx]);
  }, []);

  if (!weather) return null;

  const getIcon = (condition) => {
    switch (condition) {
      case 'sunny': return <Sun size={28} className="text-yellow-500" />;
      case 'rainy': return <CloudRain size={28} className="text-blue-500" />;
      case 'cold': return <Snowflake size={28} className="text-cyan-500" />;
      case 'cloudy': return <Cloud size={28} className="text-gray-500" />;
      default: return <Wind size={28} className="text-gray-400" />;
    }
  };

  const getSuggestions = (condition, temp) => {
    if (temp >= 32) return ['Iced Coffee', 'Cold Lassi', 'Fruit Salad', 'Chilled Juice'];
    if (temp >= 25) return ['Sandwich', 'Fresh Lime Soda', 'Light Meals'];
    if (temp >= 18) return ['Hot Coffee', 'Maggi', 'Samosa', 'Pakora'];
    return ['Hot Soup', 'Masala Chai', 'Hot Chocolate', 'Paratha'];
  };

  const getBg = (condition) => {
    switch (condition) {
      case 'sunny': return 'from-amber-100 to-orange-100 border-orange-200';
      case 'rainy': return 'from-blue-100 to-indigo-100 border-blue-200';
      case 'cold': return 'from-cyan-100 to-blue-100 border-cyan-200';
      default: return 'from-gray-100 to-slate-100 border-gray-200';
    }
  };

  const suggestions = getSuggestions(weather.condition, weather.temp);

  return (
    <div className={`bg-gradient-to-r ${getBg(weather.condition)} rounded-xl p-4 border shadow-sm`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {getIcon(weather.condition)}
          <div>
            <p className="font-semibold text-gray-800 text-sm">Weather Vibe</p>
            <p className="text-xs text-gray-500 capitalize">{weather.condition} • {weather.temp}°C</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <Thermometer size={14} />
          <span>{weather.temp}°C</span>
        </div>
      </div>
      <p className="text-xs text-gray-600 mb-2">Perfect time for:</p>
      <div className="flex flex-wrap gap-1.5">
        {suggestions.map((s, i) => (
          <span key={i} className="bg-white/70 px-2.5 py-1 rounded-full text-xs font-medium text-gray-700 shadow-sm">
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

export default WeatherVibe;
