import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// import fs from 'node:fs/promises';
// import { v4 as uuidv4 } from 'uuid'; 

// City class with name and id properties
class City {
  id: String;
  name: string;

  constructor(name: string) {
    this.id = this.generatedId();
    this.name = name;
  }

  private generatedId(): string {
    return Math.random().toString(36).substr(2,9);
  }
}

// HistoryService class
class HistoryService {

  private filePath: string;

  constructor() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    this.filePath = path.resolve(__dirname, 'searchHistory.json');
  }

  //Read method that reads from the searchHistory.json file
  private async read(): Promise<City[]> {
    try {
      const data = await fs.readFile(this.filePath, 'utf-8');
      return JSON.parse(data);

    } catch (error) {
      // If the file doesn't exist or is empty, return an empty JSON array
      if (error instanceof Error && (error as any).code === 'ENOENT') {
        return [];
      }
      throw error; // Re-throw other errors
    }
  }

  // Write method that writes the updated cities array to the searchHistory.json file
  private async write(cities: City[]): Promise<void> {
    try {
      const data = JSON.stringify(cities, null, 2);
      await fs.writeFile(this.filePath, data, 'utf-8');
    } catch (error) {
      if (error instanceof Error) {
        throw new Error('Error writing to the history file: ' + error.message);
      } else {
        throw new Error('Unknown error while writing history file.');
      }
    }
    // return await fs.writeFile('./db/searchHistory.json', JSON.stringify(cities, null, '\t'));
  }

  // GetCities method that reads the cities from the searchHistory.json file and returns them as an array of City objects
  async getCities(): Promise<City[]> {
    return await this.read();
    // .then((cities) => {
    //   let parsedCity: City[];
    //   try {
    //     parsedCity = [].concat(JSON.parse(cities));
    //   } catch (err) {
    //     parsedCity = [];
    //   }
    //   return parsedCity;
    // })
  }

  // AddCity method that adds a city to the searchHistory.json file
  async addCity(cityName: string): Promise<City> {
    const cities = await this.read();

    //check if the city already exists
    const existingCity = cities.find(city => city.name.toLowerCase() ===cityName.toLowerCase());
    if (existingCity) {
      throw new Error(`City "${cityName}" already exists in the history.`);
    }

    const newCity = new City(cityName);
    cities.push(newCity);
    await this.write(cities);
    return newCity;
    
    // const cities = await this.getCities();

    // if (cities.some((existingCity) => existingCity.name === city)) {
    //   return newCity;
    // }

    // const updatedCities = [...cities, newCity];
    // await this.write(updatedCities);

    // return newCity;
  }

  // RemoveCity method that removes a city from the searchHistory.json file
  async removeCity(id: string): Promise<boolean> {
    const cities = await this.getCities();
    const cityIndex = cities.findIndex(city => city.id === id);

    if (cityIndex === -1) {
      return false; // City not found
    }

    // Remove the city
    cities.splice(cityIndex, 1);
    await this.write(cities);
    return true; // City deleted successfully
  } catch (error: unknown) { // Use 'unknown' for the error type
    if (error instanceof Error) {
      console.error('Error in removeCity:', error.message); // Safely access the message
    } else {
      console.error('Unknown error in removeCity:', error); // Log the raw error if it's not an Error instance
    }
    throw new Error('Failed to remove city.');
  }
}

export default new HistoryService();
