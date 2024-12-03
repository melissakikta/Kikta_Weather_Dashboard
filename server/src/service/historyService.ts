import fs from 'node:fs/promise';
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
    return await fs.readfile('db/db.json'), {
      flag: 'a+',
      encoding: 'utf8',
    }
  }

  // Write method that writes the updated cities array to the searchHistory.json file
  private async write(cities: City[]) {
    return await fs.writeFile('db/db.json', JSON.stringify(cities, null, '\t'));
  }

  // GetCities method that reads the cities from the searchHistory.json file and returns them as an array of City objects
  async getCities() {
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

    return await this.getCities()
      .then((cities) => {
        if (cities.find((index) => index.name === city)) {
          return cities;
        }
        return [...cities, newCity];
      })
      .then((updatedCities)) => this.write((updatedCities))
      .then (() => newCity);
  }

  // RemoveCity method that removes a city from the searchHistory.json file
  async removeCity(id: string) {
    return await this.getCities()
    .then((cities) => cities.filter((city) => city.id !== id))
    .then((filteredCities) => this.write(filteredCities));
  }
}

export default new HistoryService();
