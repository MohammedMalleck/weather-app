import { apiKeys } from "./keys.js";
import { getWeather } from "./weather.js";
import { getAndSetImageFromCityName } from "./images.js";

const {rapidAPIKey } = apiKeys;

export class InputEvent{

  #timeoutId;
  #intervalIDSearch;
  #intervalIDWeather;
  #searchHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];

  constructor(element){
    element.addEventListener('input',()=>{
      if(element.value === ''){
        document.querySelector('header').classList.remove('typing');
      }else{
        clearInterval(this.#intervalIDSearch);
        this.#loadingEffectSearch();
        clearTimeout(this.#timeoutId);
        this.#timeoutId =  setTimeout(()=>{
          this.autoSuggestCities();
        },1000);
      };
    });

    //on clicking input element make sure that
    //search option does not get hidden.
    element.addEventListener('click',(e)=>{
      e.stopPropagation();
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
          clearInterval(this.#intervalIDSearch);   
          headEl.classList.add('typing')
          searchOptionsContainer.innerHTML = `<div class="search-option-container"><span>No results found</span></div>`;
          return;
        };

        const citiesArray = citiesArrayUnfiltered.map(cityObj => {
        return  { name : cityObj.name , latitude : cityObj.latitude , longitude : cityObj.longitude , population : cityObj.population}
        });
        //filter out the cities name that are repeated
        const citiesArrayFiltered = citiesArray.reduce((acc,city)=>{
          //filter out cities with 
          //population 0
          if(!city.population){
            return acc;
          }
          const existingCity = acc.find(city2 => city2.name === city.name)
          if(!existingCity){
            acc.push(city);
          }else if(city.population > existingCity.population){
            acc[acc.indexOf(existingCity)] = city
          }    
          return acc;
        },[]);

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
        clearInterval(this.#intervalIDSearch);
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
            const { latitude , longitude } = searchOption.dataset;
            const text = searchOption.querySelector('.city-name').textContent;
            //on clicking option , from recent searches 
            //remove the previous search and then add this
            if(this.#searchHistory.includes(text)){
              this.#removeTextFromSearchHistory(text);
            }
            this.#searchHistory.push(text);
            localStorage.setItem('searchHistory', JSON.stringify(this.#searchHistory));
            
            document.querySelector('input').value = text;
            headEl.classList.remove('typing');
            e.stopPropagation();
            this.#getWeatherHandler(latitude,longitude);
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

  #loadingEffectSearch(){
    document.querySelector('header').classList.add('typing');
    const defaultHTML = `<div class="loading-search-text">Loading</div>`;
    document.querySelector('.search-options-container').innerHTML = defaultHTML;
    this.#intervalIDSearch = this.#handleLoadingEffect('loading-search-text','search-options-container',defaultHTML);
  }

  #handleLoadingEffect(firstEl,secondEl,defaultHTML){
    let index = 0;
    return setInterval(()=>{
      if(index < 3){
        document.querySelector(`.${firstEl}`).innerHTML += '.';
        index++;
      }else{
        document.querySelector(`.${secondEl}`).innerHTML = defaultHTML;
        index = 0;
      }
    },500);
  }

  async #getWeatherHandler(latitude,longitude){
    //display loading text
    document.querySelector('.weather-data-container').classList.add('show-loading-text');
    this.#intervalIDWeather = this.#handleLoadingEffect('loading-weather-text','loading-weather-text','Loading');
    //first display weather then add image 
    await getWeather(latitude,longitude);
    //after adding weather data
    //remove the loading text
    clearInterval(this.#intervalIDWeather);
    document.querySelector('.weather-data-container').classList.remove('show-loading-text');
    await getAndSetImageFromCityName();
  }
};