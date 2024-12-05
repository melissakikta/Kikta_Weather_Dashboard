import { Router, type Request, type Response } from 'express';
const router = Router();
import historyService from '../../service/historyService.js';
import weatherService from '../../service/weatherService.js';


//POST Request with city name to retrieve weather data
router.post('/', async (req: Request, res: Response) => {
  try {
  const { cityName } = req.body; //Pull city from the request
  
  if (!cityName || typeof cityName !== 'string') {
    return res.status(400).json({error: 'City name is required and must be a string.'});
  }
  
    //Get weather data from city name
    const weatherData = await weatherService.getWeatherForCity(cityName);
    console.log(weatherData);
    
    if (!weatherData) {
      return res.status(404).json({ error: 'Weather data not found for the specified city.' });
    }

    //Save city to search history
    const savedCity = await historyService.addCity(cityName);

    //send weather data to the user
    return res.status(200).json({ weather: weatherData, savedCity });
  } catch (error) {
    console.error('Error in POST /:', error);
    return res.status(500).json({ error: 'An internal server error occurred.' });
  }
});

// GET search history
router.get('/history', async (__: Request, res: Response) => {  
  try {
    //Retrieve search history
    const cities = await historyService.getCities();

    //return the list of cities
    return res.status(200).json({history: cities});
  } catch (error) {
    console.error('Error in GET /history:', error);

    //handle errors
    return res.status(500).json({
      error: 'Failed to retrieve search history.',
    });
  }
});

// DELETE city from search history
router.delete('/history/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    //validate ID
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'City ID is required and must be a string.' });
    }
      //Delete the city from the search history
      const result = await historyService.removeCity(id);

      if (!result) {
        return res.status(404).json({ error: 'City not found in search history.' });
      }

      //respond with success message
      return res.status(200).json({
        message: `City ${id} was deleted from search history. `,
      });
  } catch (error) {
    console.error('Error deleting city form search history:', error);

    return res.status(500).json({
      error: 'Failed to delete city from search history.',
    });
  }
});

export default router;
