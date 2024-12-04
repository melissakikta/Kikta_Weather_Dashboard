import fs from 'node:fs/promises';
import { v4 as uuidv4 } from 'uuid'; 

// City class with name and id properties
class City {
  name: string;
  id: string;

  constructor(name: string, id: string) {
    this.name = name;
    this.id = id;
  }
}

// HistoryService class
class HistoryService {
  //Read method that reads from the searchHistory.json file
  private async read(): Promise<string> {
    try {
    return await fs.readFile('db/db.json', {
      flag: 'a+',
      encoding: 'utf8',
    });
    } catch (error) {
      // If the file doesn't exist or is empty, return an empty JSON array
      if (error instanceof Error && (error as any).code === 'ENOENT') {
        return '[]';
      }
      throw error; // Re-throw other errors
    }
  }

  // Write method that writes the updated cities array to the searchHistory.json file
  private async write(cities: City[]): Promise<void> {
    return await fs.writeFile('searchHistory.json', JSON.stringify(cities, null, '\t'));
  }

  // GetCities method that reads the cities from the searchHistory.json file and returns them as an array of City objects
  async getCities(): Promise<City[]> {
    return await this.read().then((cities) => {
      let parsedCity: City[];
      try {
        parsedCity = [].concat(JSON.parse(cities));
      } catch (err) {
        parsedCity = [];
      }
      return parsedCity;
    })
  }

  // AddCity method that adds a city to the searchHistory.json file
  async addCity(city: string) {
    if (!city) {
      throw new Error('City cannot be blank.');
    }

    const newCity: City = { name: city, id: uuidv4() };
    
    const cities = await this.getCities();

    if (cities.some((existingCity) => existingCity.name === city)) {
      return newCity;
    }

    const updatedCities = [...cities, newCity];
    await this.write(updatedCities);

    return newCity;
  }

  // RemoveCity method that removes a city from the searchHistory.json file
  async removeCity(id: string): Promise<boolean> {
    const cities = await this.getCities();
    const filteredCities = cities.filter((city) => city.id !== id);

    if (filteredCities.length === cities.length) {
      return false;
    }

    await this.write(filteredCities);
    return true;
  }
}

export default new HistoryService();
