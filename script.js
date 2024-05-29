import { apiKeys } from "./keys.js";

const {rapidAPIKey , openWeatherAPIKey , pixelAPIKey} = apiKeys();

async function loader() {
  const {longitude , latitude} =  await getCurrentLocation();
  document.querySelector("progress").value = 40;
  await getWeather(latitude,longitude);
  document.querySelector("progress").value = 70;
  const bgImage = await getImage(latitude, longitude);
  document.querySelector("progress").value = 100;
  setTimeout(() => {
    document.querySelector("main").style.backgroundImage = `url(${bgImage})`;
    document.querySelector("main").classList.add("loaded");
  }, 500);
}
loader();

document.querySelector("main").addEventListener('animationend',()=>{
  document.querySelector("body").style.backgroundColor = `white`;
});

async function getCurrentLocation(){
  if(navigator.geolocation){
  try{
    return await new Promise((resolve,reject)=>{
      navigator.geolocation.getCurrentPosition(position => resolve({longitude : position.coords.longitude , latitude : position.coords.latitude}), error => reject(error));
    });
    
  }catch(error){
   return  {
      longitude : 4.9041,
      latitude : 52.3676
    };
  }    
  }
}
async function getWeather(latitude,longitude){
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
 
    
  }catch(error){
    console.log(error)  
  }

  function getCurrentWeather(data){
    return {
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
        imgSrc : getImgSrc(dayWeather.weather[0].icon),
        lowestTemperature : getTemperature(dayWeather.main.temp_min),
        highestTemperature : getTemperature(dayWeather.main.temp_max)
      }
    });
  }
  function getImgSrc(id){
    const iconsInfo = [
      {
        id: '01d',
        src: 'https://raw.githubusercontent.com/basmilius/weather-icons/0985c712ee2e07b269053ff6ffd86ef79c016e3a/design/fill/final/clear-day.svg'
      },
      {
        id: '01n',
        src: 'https://raw.githubusercontent.com/basmilius/weather-icons/0985c712ee2e07b269053ff6ffd86ef79c016e3a/design/fill/final/clear-night.svg'
      },
      {
        id: '02d',
        src: 'https://raw.githubusercontent.com/basmilius/weather-icons/0985c712ee2e07b269053ff6ffd86ef79c016e3a/design/fill/final/partly-cloudy-day.svg'
      },
      {
        id: '02n',
        src: 'https://raw.githubusercontent.com/basmilius/weather-icons/0985c712ee2e07b269053ff6ffd86ef79c016e3a/design/fill/final/partly-cloudy-night.svg'
      },
      {
        id: '03d',
        src: 'https://raw.githubusercontent.com/basmilius/weather-icons/0985c712ee2e07b269053ff6ffd86ef79c016e3a/design/fill/final/overcast.svg'
      },
      {
        id: '03n',
        src: 'https://raw.githubusercontent.com/basmilius/weather-icons/0985c712ee2e07b269053ff6ffd86ef79c016e3a/design/fill/final/overcast.svg'
      },
      {
        id: '04d',
        src: 'https://raw.githubusercontent.com/basmilius/weather-icons/0985c712ee2e07b269053ff6ffd86ef79c016e3a/design/fill/final/overcast.svg'
      },
      {
        id: '04n',
        src: 'https://raw.githubusercontent.com/basmilius/weather-icons/0985c712ee2e07b269053ff6ffd86ef79c016e3a/design/fill/final/overcast.svg'
      },
      {
        id: '09d',
        src: 'https://raw.githubusercontent.com/basmilius/weather-icons/0985c712ee2e07b269053ff6ffd86ef79c016e3a/design/fill/final/rain.svg'
      },
      {
        id: '09n',
        src: 'https://raw.githubusercontent.com/basmilius/weather-icons/0985c712ee2e07b269053ff6ffd86ef79c016e3a/design/fill/final/rain.svg'
      },
      {
        id: '10d',
        src: 'https://raw.githubusercontent.com/basmilius/weather-icons/0985c712ee2e07b269053ff6ffd86ef79c016e3a/design/fill/final/rain.svg'
      },
      {
        id: '10n',
        src: 'https://raw.githubusercontent.com/basmilius/weather-icons/0985c712ee2e07b269053ff6ffd86ef79c016e3a/design/fill/final/rain.svg'
      },
      {
        id: '11d',
        src: 'https://raw.githubusercontent.com/basmilius/weather-icons/0985c712ee2e07b269053ff6ffd86ef79c016e3a/design/fill/final/thunderstorms-extreme.svg'
      },
      {
        id: '11n',
        src: 'https://raw.githubusercontent.com/basmilius/weather-icons/0985c712ee2e07b269053ff6ffd86ef79c016e3a/design/fill/final/thunderstorms-extreme.svg'
      },
      {
        id: '13d',
        src: 'https://raw.githubusercontent.com/basmilius/weather-icons/0985c712ee2e07b269053ff6ffd86ef79c016e3a/design/fill/final/snow.svg'
      },
      {
        id: '13n',
        src: 'https://raw.githubusercontent.com/basmilius/weather-icons/0985c712ee2e07b269053ff6ffd86ef79c016e3a/design/fill/final/snow.svg'
      },
      {
        id: '50d',
        src: 'https://raw.githubusercontent.com/basmilius/weather-icons/0985c712ee2e07b269053ff6ffd86ef79c016e3a/design/fill/final/mist.svg'
      },
      {
        id: '50n',
        src: 'https://raw.githubusercontent.com/basmilius/weather-icons/0985c712ee2e07b269053ff6ffd86ef79c016e3a/design/fill/final/mist.svg'
      }
    ];
  
    return iconsInfo.find(icon => icon.id === id).src;
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
async function getImage(latitude, longitude){
  try{
    const countryName = await getCountry(latitude, longitude);
    const response = await fetch(`https://api.pexels.com/v1/search?query=${countryName}&per_page=1`, {
      headers: {
        'Authorization': pixelAPIKey
      }
    });
    if(!response.ok) throw new Error('error when getting image from country name')
    const data = await response.json();
    return data.photos[0].src.original;
  }catch(error){
    console.log(error.message)
  }

  async function getCountry(latitude, longitude){
    try{
      const response = await fetch(`https://wft-geo-db.p.rapidapi.com/v1/geo/locations/${convertToISOFormat(latitude, longitude)}/nearbyCities?radius=10&limit=1`,{
      headers: {
        'X-RapidAPI-Key': rapidAPIKey,
        'X-RapidAPI-Host': 'wft-geo-db.p.rapidapi.com'
      }});
      if(!response.ok) throw new Error('error when getting country from lon lat')
      const data = await response.json();
      return data.data[0].country;
    }catch(error){
      console.log(error.message)
    };
  
    function convertToISOFormat(latitude, longitude) {
      const latitudeUnformat = latitude.toFixed(4);
      const longitudeUnformat = longitude.toFixed(4).padStart(8, '0');
      const formattedLatitude = latitude >= 0 ? `+${latitudeUnformat}` : `${latitudeUnformat}`;
      const formattedLongitude = longitude >= 0 ? `+${longitudeUnformat}` : `${longitudeUnformat}`;
      return `${formattedLatitude}${formattedLongitude}`;
    };
  };
}
class InputEvent{

  #timeoutId;
  #intervalID;
  #searchHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];
  #inputEl = document.querySelector('input');

  constructor(element){
    element.addEventListener('input',()=>{
      const keyword = this.#inputEl.value;
      if(keyword === ''){
        document.querySelector('header').classList.remove('typing');
      }else{
        clearInterval(this.#intervalID);
        this.#loadingEffect();
        clearTimeout(this.#timeoutId);
        this.#timeoutId =  setTimeout(()=>{
          this.autoSuggestCities();
        },1000);
      };
    });
  }
  
  async autoSuggestCities(){
      const searchOptionsContainer = document.querySelector('.search-options-container');
      const headEl = document.querySelector('header');
      const keyword = document.querySelector('input').value;
    

    
      const regex = new RegExp(keyword,'gi');
      try{
        const response = await fetch(`https://wft-geo-db.p.rapidapi.com/v1/geo/cities?limit=5&offset=0&types=CITY&namePrefix=${keyword}`,{
          headers : {
            'X-RapidAPI-Key' : rapidAPIKey,
            'X-RapidAPI-Host': 'wft-geo-db.p.rapidapi.com'
          }
        });
    
        if(!response.ok) throw new Error('Some network issues while fetching matching cities from given keyword');
        
    
        const responseData = await response.json();
        const citiesArrayUnfiltered = responseData.data;
    
    
        if(!citiesArrayUnfiltered.length){
          headEl.classList.add('typing')
          searchOptionsContainer.innerHTML = `<div class="search-option-container"><span>No results found</span></div>`;
          return;
        };

        const citiesArray = citiesArrayUnfiltered.map(cityObj => {
        return  { name : cityObj.name , latitude : cityObj.latitude , longitude : cityObj.longitude}
        });
        //filter out the cities name that are repeated
        const seen = new Set();
        const citiesArrayFiltered = citiesArray.filter(city =>{
          const duplicate =  seen.has(city.name)
          seen.add(city.name);
          return !duplicate
        });

        //modify the array so the city names that have been searched before have a 
        //unqiue "hasBeenSearched" property and are at the top of the resulting array
        //accroding to the latest search...
        //ie : the matched keyword which was searched recently appears at the very top
        //and so on

        const citiesArrayHistory = [
          ...this.#searchHistory.reduce((acc,searchTxt) => {
            const keyObj = citiesArrayFiltered.find(key => key.name === searchTxt);
            if(keyObj){
              acc.unshift({...keyObj,hasBeenSearched :true})
            }
            return acc;
          },[]),
          ...citiesArrayFiltered.filter(city => !this.#searchHistory.includes(city.name))
        ];


        //display search options container
        if(!headEl.classList.contains('typing')){
          headEl.classList.add('typing');
        }
        //clear out the interval
        clearInterval(this.#intervalID);
        //add html content to search options container 
        searchOptionsContainer.innerHTML = citiesArrayHistory.map(cityObj => {
            return `<div class="search-option-container ${cityObj.hasBeenSearched ?'recent-searched':''}" 
            data-latitude="${cityObj.latitude}"
            data-longitude="${cityObj.longitude}"
            >
            <i id="history" class="fa-solid fa-clock-rotate-left"></i>
            <i id="location" class="fa-solid fa-location-dot"></i>
            <div class="city-name">${cityObj.name}</div>
            <div class="recent-container">
              <div class="remove-text">remove</div>
            </div>
          </div>`
        }).join('\n');
    
        //make matching keyword bold 
        document.querySelectorAll('.city-name').forEach(cityNameEl =>
        {
          const cityName =  cityNameEl.textContent;
          const newText = cityName.replace(regex,match =>`<span>${match}</span>`);
          cityNameEl.innerHTML = newText;
        });

        document.querySelectorAll('.search-option-container').forEach(searchOption => {
          searchOption.addEventListener('click',(e)=>{
            const text = searchOption.querySelector('.city-name').textContent;
            //on clicking option from recent searches 
            //remove the previous search and then add this
            if(this.#searchHistory.includes(text)){
              this.#removeTextFromSearchHistory(text);
            }
            this.#searchHistory.push(text);
            localStorage.setItem('searchHistory', JSON.stringify(this.#searchHistory));
            
            document.querySelector('input').value = text;
            headEl.classList.remove('typing');
            e.stopPropagation();
          })
        });

        document.querySelectorAll('.remove-text').forEach(removeEl => {
          removeEl.addEventListener('click',(e)=>{
            const optionEl = removeEl.parentElement.parentElement;
            const text = removeEl.parentElement.previousElementSibling.textContent;
            this.#removeTextFromSearchHistory(text);
            optionEl.classList.add('hide');
            //hide the search options bar if 
            //only one option was displayed
            if(citiesArrayHistory.length < 2){
              headEl.classList.remove('typing');
            }
            e.stopPropagation();
          });
        });

        document.body.addEventListener('click',()=>{
          headEl.classList.remove('typing');
        });
      } catch(error){
        console.log(`Error while fetching cities suggestions : ${error.message}`)
      }
  };

  #removeTextFromSearchHistory(text){
    const index =  this.#searchHistory.indexOf(text);
    this.#searchHistory.splice(index,1);
    localStorage.setItem('searchHistory', JSON.stringify(this.#searchHistory));
  }

  #loadingEffect(){
    document.querySelector('header').classList.add('typing');
    const defaultHTML = document.querySelector('.search-options-container').innerHTML = `<div class="loading-search-text">Loading</div>`;
    let index = 0;
    this.#intervalID = setInterval(()=>{
      if(index < 3){
        document.querySelector('.loading-search-text').innerHTML += '.';
        index++;
      }else{
        document.querySelector('.search-options-container').innerHTML = defaultHTML;
        index = 0;
      }
    },500);
  }

};

new InputEvent(document.querySelector('input'));