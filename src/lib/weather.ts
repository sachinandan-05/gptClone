// Define the base weather data structure
interface WeatherData {
  temperature: string;
  unit: 'celsius' | 'fahrenheit';
  condition: string;
  location: string;
  humidity: string;
  wind: string;
}

// Define the structure for the weather data in the map
interface WeatherMapData {
  celsius: string;
  fahrenheit: string;
  condition: string;
  humidity: string;
  wind: string;
}

type WeatherMap = {
  [key: string]: WeatherMapData;
};

export function getCurrentWeather(location: string, unit: 'celsius' | 'fahrenheit' = 'celsius'): WeatherData {
  // Mock weather data
  const weatherMap: WeatherMap = {
    'Tokyo, Japan': {
      celsius: '22°C',
      fahrenheit: '72°F',
      condition: 'Sunny',
      humidity: '65%',
      wind: '10 km/h',
    },
    'San Francisco, CA': {
      celsius: '18°C',
      fahrenheit: '64°F',
      condition: 'Partly Cloudy',
      humidity: '70%',
      wind: '15 km/h',
    },
    'New York, NY': {
      celsius: '20°C',
      fahrenheit: '68°F',
      condition: 'Mostly Sunny',
      humidity: '60%',
      wind: '12 km/h',
    },
  };

  // Get data for the location or use default values
  const data = weatherMap[location] || {
    celsius: '20°C',
    fahrenheit: '68°F',
    condition: 'Unknown',
    humidity: '0%',
    wind: '0 km/h',
  };

  return {
    temperature: unit === 'celsius' ? data.celsius : data.fahrenheit,
    unit,
    condition: data.condition,
    location,
    humidity: data.humidity,
    wind: data.wind,
  };
}
