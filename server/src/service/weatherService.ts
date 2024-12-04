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
    this.cityName = '';
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
     return this.parseCurrentWeather(response.data);

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
  private parseCurrentWeather(response: any) {
    try {
      //Get fields from API response
      const {
        name: city,
        weather: [{ description: condition }],
        main: { temp: temperature, humidity },
        wind: { speed: wind }, 
      } = response;

      //Create and Return a Weather Object
      return new Weather(city, condition, temperature, wind, humidity);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error('Error parsing weather data: ' + error.message);
      } else {
        throw new Error('Unknown error while parsing weather data.');
      }
    }
  }

  // buildForecastArray method
  private buildForecastArray(currentWeather: Weather, weatherData: any[]): Weather [] {
    try {
      //Put the current weather as the first element in the array
      const forecastArray: Weather[] = [currentWeather];

      // Make the forecast data
      weatherData.forEach((data) => {
        const {
          name: city,
          weather: [{ description: condition }],
          main: { temp: temperature, humidity },
          wind: { speed: wind },
        } = data;

        //New Weather object for each forecast item
        const forecastWeather = new Weather(city, condition, temperature, wind, humidity);

        //Add to Forecast array
        forecastArray.push(forecastWeather);
      });

      //Return array of Weather onjects
      return forecastArray;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error('Error building forecast array: ' + error.message);
      } else {
        throw new Error('Unknown error occurred while building forecast array.');
      }
    }
  }

  // getWeatherForCity method
  async getWeatherForCity(city: string): Promise<Weather | Weather[] | null> {
    try {
      //set city name
      this.cityName = city;

      //Get and destructure coordinates
      const coordinates = await this.fetchAndDestructureLocationData();
      if (!coordinates) {
        console.error('Unable to retrieve weather data for the city.');
        return null;
      }

      //Get current weather data
      const currentWeather = await this.fetchWeatherData(coordinates);
      if (!currentWeather) {
        console.error('Could not retrieve weather data for city.');
        return null;
      }

      //Get forecast data
      const forecastQuery = `${this.baseURL}/forecast?lat=${coordinates.latitude}&lon=${coordinates.longitude}&apiKey=${this.apiKey}`;
      const forecastResponse = await axios.get(forecastQuery);

      //Create forecast array with current weather and forecast data
      const forecastArray = this.buildForecastArray(currentWeather, forecastResponse.data.daily);

      //Return current weather and forecast array
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
}

export default new WeatherService();
