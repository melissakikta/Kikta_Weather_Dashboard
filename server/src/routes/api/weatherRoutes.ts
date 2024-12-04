import { Router, type Request, type Response } from 'express';
const router = Router();
import historyService from '../../service/historyService';
import weatherService from '../../service/weatherService';


//POST Request with city name to retrieve weather data
router.post('/', async (req: Request, res: Response) => {
  
    const { city } = req.body; //Pull city from the request
    
    if (!city) {
      return res.status(400).json({error: 'City name is required.'});
    }

  try {
    //Get weather data from city name
    const weatherData = await weatherService.getWeatherForCity(city);

    //Save city to search history
    await historyService.addCity(city);

    //send weather data to the user
    return res.status(200).json({
      message: 'Weather data retrieved successfully.',
      data: weatherData,
    });
  } catch (error) {
    console.error('Error retrieving weather data:', error);

    //Message if city isn't in the database
    return res.status(500).json({
      error: 'City cannot be found',
    });
  }
});

// GET search history
router.get('/history', async (_, res: Response) => {  
    //Retrieve search history
    const searchHistory = await historyService.getCities();
  
  try {
    //Check for search history
    if (!searchHistory || searchHistory.length === 0) {
      return res.status(404).json({
        message: 'No search history found.',
      });
    }

    //send search history to the user
    return res.status(200).json({
      message: 'Search history',
      data: searchHistory,
    });
  } catch (error) {
    console.error('Error retrieving search history:', error);

    //handle errors
    return res.status(500).json({
      error: 'Failed to retrieve search history.',
    });
  }
});

// * BONUS TODO: DELETE city from search history
router.delete('/history/:id', async (req: Request, res: Response) => {
  
    //Get city ID from parameters
    const city = req.params.id;
  
  try {
    //Check the input
    if (!city) {
      return res.status(400).json({
        error: 'City name required to delete.',
      });
      }

      //Delete the city from the search history
      const wasRemoved = await historyService.removeCity(city);

      if (!wasRemoved) {
        return res.status(404).json({
          message: `City "${city}" not found in search history.`
        });
      }

      //respond with success message
      return res.status(200).json({
        message: `City ${city} was deleted from search history. `,
      });
  } catch (error) {
    console.error('Error deleting city form search history:', error);

    return res.status(500).json({
      error: 'Failed to delete city from search history.',
    });
  }
});

export default router;
