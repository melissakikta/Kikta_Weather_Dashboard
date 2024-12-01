import fs from 'node:fs/promises'
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
  condition: string;
  temperature: number;
  wind: number;
  humidity: number;

  constructor(
    city: string,
    condition: string,
    temperature: number,
    wind: number,
    humidity: number,
  ){
    this.city = city;
    this.condition = condition;
    this.temperature = temperature;
    this.wind = wind;
    this.humidity = humidity;
  }
  displayWeather(): string {
    return `weather in ${this.city}:
    ${this.condition}
    Temperature: ${this.temperature}°F
    Wind Speed: ${this.wind} m/s
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
    this.cityName = process.env.API_CITY_NAME || '';
  }
  // fetchLocationData method for getting lat and lon coordinates
  private async fetchLocationData(query: string): Promise<Coordinates | null> {
    //Check for baseURL and apiKey
    if (!this.baseURL || ! this.apiKey) {
      throw new Error('API base URL or APLI key is not correct.');
    }

    try {
      const response = await axios.get(`${this.baseURL}/locations`, {
        params: {
          query, //city or location
          apiKey: this.apiKey,
        },
      });
      //Get and return the coordinates from API
      const { latitude, longitude } = response.data;

      return {
        latitude,
        longitude,
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
      longitude,
    };
  }

  // buildGeocodeQuery method
  private buildGeocodeQuery(): string {
    if (!this.cityName) {
      throw new Error('City name is not valid.');
    }

    //Query string for geocoding
    const query = encodeURIComponent(this.cityName.trim());

    return query;
  }

  // buildWeatherQuery method
  private buildWeatherQuery(coordinates: Coordinates): string {
    if (!coordinates || typeof coordinates.latitude !== 'number' || typeof coordinates.longitude !== 'number') {
      throw new Error('Invalid location: Latitude and Longitude must be numbers');
    }

    if (!this.baseURL || !this.apiKey) {
      throw new Error('API base URL or APLI key is not correct.')
    }

    //Query URL for weather data
    const { latitude, longitude } = coordinates;

    const query = `${this.baseURL}/weather?lat=${latitude}&lon=${longitude}&apiKey=${this.apiKey}`;

    return query;
  }

  // fetchAndDestructureLocationData method
  private async fetchAndDestructureLocationData(): Promise<Coordinates | null> {
    try {
      //Build the geocode query with city name
      const geocodeQuery = this.buildGeocodeQuery();
      //fetch location data from query
      const locationData = await this.fetchLocationData(geocodeQuery);
      //Destructure data or error out
      if (locationData) {
        return this.destructureLocationData(locationData);
      } else {
        console.error('Failed to fetch location data.');
        return null;
      }
    } catch (error) {
      console.error('Error in fetchAndDestructureLocationData:', error.message);
      return null;
    }
  }

  // TODO: Create fetchWeatherData method
  private async fetchWeatherData(coordinates: Coordinates) {}

  // TODO: Build parseCurrentWeather method
  private parseCurrentWeather(response: any) {}

  // TODO: Complete buildForecastArray method
  private buildForecastArray(currentWeather: Weather, weatherData: any[]) {}

  // TODO: Complete getWeatherForCity method
  async getWeatherForCity(city: string) {}

}

export default new WeatherService();
