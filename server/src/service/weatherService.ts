import dotenv from 'dotenv';
import axios from 'axios';
dotenv.config();

// Interface for the Coordinates object
interface Coordinates {
  latitude: number
  longitude: number;
};

// Class for the Weather object
class Weather {
  city: string;
  date: string; // Added
  icon: string; // Added
  iconDescription: string; // Added
  tempF: number; // Added
  windSpeed: number; // Renamed from `wind`
  humidity: number;

  constructor(
    city: string,
    date: string,
    icon: string,
    iconDescription: string,
    tempF: number,
    windSpeed: number,
    humidity: number
  ) {
    this.city = city;
    this.date = date;
    this.icon = icon;
    this.iconDescription = iconDescription;
    this.tempF = tempF;
    this.windSpeed = windSpeed;
    this.humidity = humidity;
  }

  displayWeather(): string {
    return `Weather in ${this.city} on ${this.date}:
    ${this.iconDescription} (${this.icon})
    Temperature: ${this.tempF}°F
    Wind Speed: ${this.windSpeed} m/s
    Humidity: ${this.humidity}%`;
  }
}

// WeatherService class
class WeatherService {
  // BaseURL, API key, and city name properties
  private baseURL?: string;
  private apiKey?: string;
  private cityName?: string;

  constructor(){
    this.baseURL = process.env.API_BASE_URL || '';
    this.apiKey = process.env.API_KEY || '';
    this.cityName = '';
  }
  // fetchLocationData method for getting lat and lon coordinates
  private async fetchLocationData(query: string): Promise<Coordinates | null> {
    //Check for baseURL and apiKey
    if (!this.baseURL || ! this.apiKey) {
      throw new Error('API base URL or APLI key is not correct.');
    }

    try {
      const response = await axios.get(`${this.baseURL}/geo/1.0/direct`, {
        params: {
          q: query, //city or location
          appid: this.apiKey,
        },
      });

      console.log('Location API Response:', response.data);

      if (response.data.length === 0) {
        console.error(`No location found: ${query}`);
        return null;
      }
      //Get and return the coordinates from API
      const { lat: latitude, lon: longitude } = response.data[0];
      console.log('API Response Data:', response.data);
      
      return {
        latitude,
        longitude
      };
    } catch (error) {
      console.error('Error retreiving location data:', error);
      return null;
    }
  }
  // destructureLocationData method
  private destructureLocationData(locationData: Coordinates): Coordinates {
    const { latitude, longitude } = locationData;

    //Check lat and lon are numbers
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      throw new Error('Invalid location: Latitude and Longitude must be numbers');
    }
    //return the structured coordinates object
    return {
      latitude, 
      longitude
    };
  }

  // buildGeocodeQuery method
  private buildGeocodeQuery(): string {
    if (!this.cityName) {
      throw new Error('City name is not valid.');
    }

    //Query string for geocoding
    return encodeURIComponent(this.cityName.trim());
  }

  // buildWeatherQuery method
  private buildWeatherQuery(coordinates: Coordinates): string {
    const { latitude, longitude } = coordinates;
    return `${this.baseURL}/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${this.apiKey}&units=imperial`;
  }


  // fetchAndDestructureLocationData method
  private async fetchAndDestructureLocationData(): Promise<Coordinates | null> {
    try {
    // Log the city name for debugging
    console.log('Fetching location data for city:', this.cityName);

    // Build the geocode query with city name
    const geocodeQuery = this.buildGeocodeQuery();

    // Fetch location data from the query
    const locationData = await this.fetchLocationData(geocodeQuery);

    if (!locationData) {
      console.error('No location data returned for city:', this.cityName);
      return null;
    }

    // Log the retrieved location data for debugging
    console.log('Retrieved Location Data:', locationData);

    // Destructure and validate the location data
    return this.destructureLocationData(locationData);      


    } catch (error) {
      // Narrow the type of error before accessing `message`
      if (error instanceof Error) {
        console.error('Error in fetchAndDestructureLocationData:', error.message);
      } else {
        console.error('Unknown error in fetchAndDestructureLocationData:', error);
      }
      return null;
    }
  }

  // fetchWeatherData method
  private async fetchWeatherData(coordinates: Coordinates): Promise<Weather | null> { 
    try {
      //Weather query URL
      const weatherQuery = this.buildWeatherQuery(coordinates);

      //get weather data from API
      const response = await axios.get(weatherQuery);

      //get fields from API response
     const parsedWeather = this.parseCurrentWeather(response.data);

     if (!parsedWeather) {
      throw new Error('Parsed weather data is null or invalid.');
    }
    return parsedWeather; 
    
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error getting weather data:', error.message);
      } else {
        console.error('Unknown error in fetchWeatherData:', error);
      }
      return null;
    }
  }

  //parseCurrentWeather method
  private parseCurrentWeather(response: any): Weather | null {
    try {
      const {
        name: city,
        weather: [{ icon, description: iconDescription }],
        main: { temp: tempK, humidity },
        wind: { speed: windSpeed },
        dt, // Unix timestamp for the date
      } = response;
  
      // Convert temperature from Kelvin to Fahrenheit
      const tempF = ((tempK - 273.15) * 9) / 5 + 32;
  
      // Convert timestamp to a readable date format
      const date = new Date(dt * 1000).toLocaleDateString();
  
      return new Weather(city, date, icon, iconDescription, tempF, windSpeed, humidity);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error('Error parsing weather data: ' + error.message);
      } else {
        throw new Error('Unknown error while parsing weather data.');
      }
    }
  }

  // buildForecastArray method
  private buildForecastArray(currentWeather: Weather, weatherData: any[]): Weather[] {
    // Start with the current weather as the first element
    const forecastArray: Weather[] = [currentWeather];
    const filteredWeatherData = weatherData.filter((data:any) => {
      return data.dt_txt.includes('12:00:00')
    })

    // Loop through the forecast data (list of time slots)
    filteredWeatherData.forEach((data) => {
      const {
        dt, // Timestamp for the forecast
        weather: [{ icon, description: iconDescription }], // Weather details
        main: { temp, humidity }, // Temperature and humidity
        wind: { speed: windSpeed }, // Wind speed
      } = data;
  
      // Convert temperature from Kelvin to Fahrenheit
      const tempF = ((temp - 273.15) * 9) / 5 + 32;
  
      // Convert timestamp to a readable date
      const date = new Date(dt * 1000).toLocaleDateString();
  
      // Build a Weather object for each forecast time slot
      const forecastWeather = new Weather(
        currentWeather.city, // City name
        date, // Date
        icon, // Icon code
        iconDescription, // Weather description
        tempF, // Temperature in Fahrenheit
        windSpeed, // Wind speed in m/s
        humidity // Humidity percentage
      );
  
      forecastArray.push(forecastWeather);
    });
  
    return forecastArray;
  }
  

  // getWeatherForCity method
  async getWeatherForCity(city: string): Promise<Weather | Weather[] | null> {
    try {
      // Set city name
      this.cityName = city;
  
      // Get and destructure coordinates
      const coordinates = await this.fetchAndDestructureLocationData();
      if (!coordinates) {
        console.error('Unable to retrieve weather data for the city.');
        return null;
      }
  
      // Get current weather data
      const currentWeather = await this.fetchWeatherData(coordinates);
      if (!currentWeather) {
        console.error('Could not retrieve weather data for city.');
        return null;
      }
  
      // Get forecast data
      const forecastQuery = `${this.baseURL}/data/2.5/forecast?lat=${coordinates.latitude}&lon=${coordinates.longitude}&appid=${this.apiKey}`;
      const forecastResponse = await axios.get(forecastQuery);
  
      // Verify if forecast data exists
      if (!forecastResponse.data || !forecastResponse.data.list) {
        console.error('No forecast data found in API response.');
        return currentWeather; // Return current weather if no forecast
      }
  
      // Extract forecast data from the "list" property
      const forecastArray = this.buildForecastArray(currentWeather, forecastResponse.data.list);
  
      // Return the weather data
      return forecastArray;
  
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error in getWeatherForCity:', error.message);
      } else {
        console.error('Unknown error in getWeatherForCity:', error);
      }
      return null;
    }
  }
  // async getWeatherForCity(city: string): Promise<Weather | Weather[] | null> {
  //   try {
  //     //set city name
  //     this.cityName = city;

  //     //Get and destructure coordinates
  //     const coordinates = await this.fetchAndDestructureLocationData();
  //     if (!coordinates) {
  //       console.error('Unable to retrieve weather data for the city.');
  //       return null;
  //     }

  //     //Get current weather data
  //     const currentWeather = await this.fetchWeatherData(coordinates);
  //     if (!currentWeather) {
  //       console.error('Could not retrieve weather data for city.');
  //       return null;
  //     }

  //     //Get forecast data
  //     const forecastQuery = `${this.baseURL}/data/2.5/forecast?lat=${coordinates.latitude}&lon=${coordinates.longitude}&appid=${this.apiKey}`;
  //     const forecastResponse = await axios.get(forecastQuery);

  //     //Return current weather and forecast array
  //     return this.buildForecastArray(currentWeather, forecastResponse.data.daily);

  //   } catch (error) {
  //     if (error instanceof Error) {
  //       console.error('Error in getWeatherForCity:', error.message);
  //     } else {
  //       console.error('Unknown error in getWeatherForCity:', error);
  //     }
  //     return null;
  //   }
  // }
}

export default new WeatherService();
