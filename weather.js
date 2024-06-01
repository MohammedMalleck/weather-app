import { apiKeys } from "./keys.js";

const { openWeatherAPIKey } = apiKeys;

export async function getWeather(latitude,longitude){
  try{
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${openWeatherAPIKey}`);
    const responseForecast = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&cnt=5&appid=${openWeatherAPIKey}`);


    if(!response.ok) throw new Error('Error while fetching data for co-ordinates current weather');
    if(!responseForecast.ok) throw new Error('Error while fetching data for co-ordinates forecast');

    const data = await response.json();
    const dataForecast = await responseForecast.json();
    
    const currentWeather = getCurrentWeather(data);
    const weatherForecast = get5DayForecast(dataForecast,currentWeather.currentTimeShort);

    renderCurrentWeather(currentWeather);
    renderForecastWeather(weatherForecast);

    //give header lat and lon values
    document.querySelector('header').dataset.lat = latitude;
    document.querySelector('header').dataset.lon = longitude;

    return {id : currentWeather.id , cityName : currentWeather.cityName};
 
  }catch(error){
    document.querySelector('.error-container').classList.add('show');
    document.querySelector('.additional-info-error').innerHTML = error.message;
  }

  function getCurrentWeather(data){
    return {
      id : data.weather[0].icon,
      cityName : data.name,
      weatherDescription : data.weather[0].description.replace(/\b\w/g,match => match.toUpperCase()),
      imgSrc : getImgSrc(data.weather[0].icon),
      temperature : getTemperature(data.main.temp),
      feelsLike : getTemperature(data.main.feels_like),
      windSpeed : (data.wind.speed).toFixed(1) + 'km/h',
      windDirection : data.wind.deg + '°',
      humidity : data.main.humidity + '%',
      currentTimeLong : getCurrentTime(data.timezone).cityCurrentTime,
      currentTimeShort : getCurrentTime(data.timezone).cityCurrentTimeShort,
    };
  }
  function get5DayForecast(data,currentTime){
    const DAYS =  getDaysName(currentTime);
    return data.list.map((dayWeather,index) => {
      return {
        dayName : DAYS[index],
        //all forcast icons must be in day format
        imgSrc : getImgSrc(dayWeather.weather[0].icon.replace(/\w$/,'d')),
        lowestTemperature : getTemperature(dayWeather.main.temp_min),
        highestTemperature : getTemperature(dayWeather.main.temp_max)
      }
    });
  }
  function getImgSrc(id){
    const iconsInfo = {
      '01d' : 'clear-day',
      '01n' : 'clear-night',
      '02d' : 'partly-cloudy-day',
      '02n' : 'partly-cloudy-night',
      '03d' : 'overcast',
      '03n' : 'overcast',
      '04d' : 'overcast',
      '04n' : 'overcast',
      '09d' : 'rain',
      '09n' : 'rain',
      '10d' : 'rain',
      '10n' : 'rain',
      '11d' : 'thunderstorms-extreme',
      '11n' : 'thunderstorms-extreme',
      '13d' : 'snow',
      '13n' : 'snow',
      '50d' : 'mist',
      '50n' : 'mist'
    };
    return `https://raw.githubusercontent.com/basmilius/weather-icons/0985c712ee2e07b269053ff6ffd86ef79c016e3a/design/fill/final/${iconsInfo[id]}.svg`;
  }
  function getTemperature(temperature){
    return (temperature - 273.15).toFixed(0) + '°C'
  };
  function getCurrentTime(timezoneOffset){
    const d = new Date();
    const localTime = d.getTime();
    const localOffset = d.getTimezoneOffset() * 60000;
    const utc = localTime + localOffset;
    const cityUTC = utc + (1000 * timezoneOffset);
    const {format} = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      hour12: true,
      minute :'2-digit',
      weekday:'long',
    });
    const formatter = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      hour12: true,
      minute :'2-digit',
      weekday:'short',//get weekday in short format
    });
    const cityCurrentTime = format(new Date(cityUTC)).replace(' ',' , ');
    const cityCurrentTimeShort = formatter.format(new Date(cityUTC)).replace(' ',' , ')
    return {cityCurrentTime,cityCurrentTimeShort};
  }
  function getDaysName(currentTimeShort){
    const {format} = new Intl.DateTimeFormat('en-us',{weekday : 'short'});
    const DAYS = Array.from({length:7},(_,day) => format(new Date(2021,5,day)));
    const dayName = currentTimeShort.slice(0,3);
    const dayNameIndex = DAYS.indexOf(dayName) + 1;
    return [].concat(DAYS.slice(dayNameIndex) , DAYS.slice(0,dayNameIndex))
  } 

  //render data on page
  function renderCurrentWeather(currentWeather){
    document.querySelector('.current-weather-icon').innerHTML = `<img src="${currentWeather.imgSrc}"/>`;
    document.querySelector('.current-weather-description').innerHTML = currentWeather.weatherDescription;
    document.querySelector('.current-weather-celsius').innerHTML = currentWeather.temperature;
    document.querySelector('.time').innerHTML = currentWeather.currentTimeLong;
    document.querySelector('.time-short').innerHTML = currentWeather.currentTimeShort;

    const headings = ['Feels Like', 'Wind Speed' , 'Wind Direction' , 'Humidity'];
    document.querySelectorAll('.extra-data-container').forEach((dataEl,index)=>{
      const keyWithCorrectCase = headings[index].replace(/\b\w/,match => match.toLowerCase())
      const key = keyWithCorrectCase.replace(' ','');
      dataEl.querySelector('.data-heading').innerHTML = headings[index];
      dataEl.querySelector('.data-value').innerHTML = currentWeather[key];
    })
  }
  function renderForecastWeather(forecastWeather){
    document.querySelector('.forecast-data-container').innerHTML = forecastWeather.map(dayWeather=>{
      return `<div class="forecast-data">
      <div class="forecast-weather-icon">
        <img src="${dayWeather.imgSrc}"/>
      </div>
      <div class="forecast-weather">
        <div class="highest-celsius">${dayWeather.highestTemperature}</div>
        <div class="lowest-celsius">${dayWeather.lowestTemperature}</div>
      </div>
      <div class="forecast-day">${dayWeather.dayName}</div>
    </div>`
    }).join('\n');
  }
}