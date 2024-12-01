import { Router, type Request, type Response } from 'express';
const router = Router();
import historyService from '../../service/historyService';
import weatherService from '../../service/weatherService';


// TODO: POST Request with city name to retrieve weather data
router.post('/', async (req: Request, res: Response) => {
  try {
    const { city } = req.body; //Pull city from the request
    if (!city) {
      return res.status(400).json({error: 'City name is required.'});
    }

    //Get weather data from city name
    const weatherData = await weatherService.getWeatherByCity(city);

    //Save city to search history
    await historyService.saveCity(city);

    //send weather data to the user
    res.status(200).json({
      message: 'Weather data retrieved successfully.',
      data: weatherData,
    });
  } catch (error) {
    console..error('Error retrieving weather data:', error);

    //Message if city isn't in the database
    res.status(500).json({
      error: 'City cannot be found',
    });
  }
});

// TODO: GET search history
router.get('/history', async (req: Request, res: Response) => {});

// * BONUS TODO: DELETE city from search history
router.delete('/history/:id', async (req: Request, res: Response) => {});

export default router;
