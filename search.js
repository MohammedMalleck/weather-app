import { apiKeys } from "./keys.js";
import { getWeather } from "./weather.js";
import { timer } from "./script.js";


const { geoCodingAPIKey } = apiKeys;

export class InputEvent{

  #timeoutId;
  #intervalIDSearch;
  #intervalIDWeather;
  #searchHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];
  #lastCallID = 0;
  #callID = 0;

  constructor(inputEl,searchIcon){
    inputEl.addEventListener('input',()=>{
      this.#callID = ++this.#lastCallID;
      clearInterval(this.#intervalIDSearch);
      this.#loadingEffectSearch();
      clearTimeout(this.#timeoutId);
      this.#timeoutId =  setTimeout(()=>{
        this.#autoSuggestCities(this.#callID);
      },1000);
    });

    //on clicking input element make sure that
    //search option does not get hidden.
    inputEl.addEventListener('click',(e)=>{
      e.stopPropagation();
    });

    inputEl.addEventListener('keydown',(e)=>{
      if(e.key === 'Enter'){
        this.#handleSearch();
      }
    });

    searchIcon.addEventListener('click',(e)=>{
      this.#handleSearch();
      e.stopPropagation();
    });
  };
  
  async #autoSuggestCities(callID){
      const searchOptionsContainer = document.querySelector('.search-options-container');
      const headEl = document.querySelector('header');
      const keyword = document.querySelector('input').value;
      const regex = new RegExp(keyword,'gi');

      if(keyword === ''){
        headEl.classList.remove('typing')
        return;
      }

      try{
        const response = await fetch(`https://api.geoapify.com/v1/geocode/autocomplete?text=${keyword}&lang=en&format=json&apiKey=${geoCodingAPIKey}`);

        if(!response.ok) throw new Error('error found');
        
        const data = await response.json();

        if(!data.results.length && callID === this.#lastCallID){
          clearInterval(this.#intervalIDSearch);   
          headEl.classList.add('typing')
          searchOptionsContainer.innerHTML = `<div class="search-option-container"><span>No results found</span></div>`;
          return;
        };

        //make sure the same city with same state , region and country is not repeated
        const citiesDATA = data.results.reduce((acc,result) => {
          if(result.city){
            const state = result.city === result.state ? result.region  : result.state || result.region;

            const key = `${result.city}-${state}-${result.country}`;
            if(!acc.set.has(key)){
              acc.set.add(key);
              acc.cities.push({
                city : result.city,
                state : state,
                country : result.country,
                lat : result.lat,
                lon : result.lon,
              });
            };
          }      
          return acc;
        },{set : new Set() , cities : []});
        //if any of these city have been searched before modify the data
        //such that the most recent matched city appears at the top and so on 
        const setSearch = new Set();
        const citiesDATAWithSearchHistory = [...this.#searchHistory.reduce((acc,cityDetails)=>{
          const key = `${cityDetails.city}-${cityDetails.state}-${cityDetails.country}`;
          if(citiesDATA.set.has(key)){
            setSearch.add(key)
            acc.unshift({...cityDetails,hasBeenSearched : true});
          }
          return acc;
        },[]),...citiesDATA.cities.filter(cityDetails => !setSearch.has(`${cityDetails.city}-${cityDetails.state}-${cityDetails.country}`))];
          
        
        if(callID === this.#lastCallID){
          //clear out the interval
          clearInterval(this.#intervalIDSearch);
          headEl.classList.add('typing');
          //add html content to search options container 
          searchOptionsContainer.innerHTML = citiesDATAWithSearchHistory.map(cityDetails => {
              return `<div class="search-option-container ${cityDetails.hasBeenSearched ? 'recent-searched' : ''}" 
              data-lat="${cityDetails.lat}"
              data-lon="${cityDetails.lon}"
              >
              <i id="history" class="fa-solid fa-clock-rotate-left"></i>
              <i id="location" class="fa-solid fa-location-dot"></i>
              <div><span class="city-name">${cityDetails.city}</span>${cityDetails.state ? ` , <span class="state-name">${cityDetails.state}</span>`:''} , <span class="country-name">${cityDetails.country}</span></div>
              <div class="recent-container">
                <div class="remove-text">remove</div>
              </div>
            </div>`
          }).join('\n');
          //make matching keyword bold 
          document.querySelectorAll('.search-option-container').forEach(optionEl =>{
            const cityEl = optionEl.querySelector('.city-name');
            const stateEl = optionEl.querySelector('.state-name');
            const countryEl = optionEl.querySelector('.country-name');
            //if the keyword does not match any 
            //word in the city then  match every letter 
            //in city ,state(if availabe) & country
            //with letters in the keyword
            if(regex.test(cityEl.textContent)){
              const newText = cityEl.textContent.replace(regex, match => `<span class="bold-text">${match}</span>`);
              cityEl.innerHTML = newText;
            }else{
              const letters = [...new Set(keyword)].join('');
              const regexp = new RegExp(`[${letters}]`,'gi');
              const newText = cityEl.textContent.replace(regexp, match => `<span class="bold-text">${match}</span>`);
              cityEl.innerHTML = newText;
              if(stateEl){
                const newText = stateEl.textContent.replace(regexp, match => `<span class="bold-text">${match}</span>`);
                stateEl.innerHTML = newText;
              }
              const newTextCountry = countryEl.textContent.replace(regexp, match => `<span class="bold-text">${match}</span>`);
              countryEl.innerHTML = newTextCountry;
            }
            
          });

          document.querySelectorAll('.search-option-container').forEach(searchOption => {
            searchOption.addEventListener('click',(e)=>{
              const { lat , lon } = searchOption.dataset;
              const cityDetails = this.#removeCityFromSearchHistory(searchOption);
              this.#searchHistory.push(cityDetails);
              localStorage.setItem('searchHistory', JSON.stringify(this.#searchHistory));        
              document.querySelector('input').value = searchOption.querySelector('.city-name').textContent;
              headEl.classList.remove('typing');
              e.stopPropagation();
              this.#getWeatherHandler(lat,lon);
            })
          });

          document.querySelectorAll('.remove-text').forEach(removeEl => {
            removeEl.addEventListener('click',(e)=>{
              const optionEl = removeEl.parentElement.parentElement;
              this.#removeCityFromSearchHistory(optionEl);
              localStorage.setItem('searchHistory', JSON.stringify(this.#searchHistory));      
              optionEl.classList.add('hide');
              //hide the search options bar if 
              //only one option was displayed
              if(citiesDATAWithSearchHistory.length < 2){
                headEl.classList.remove('typing');
              }
              e.stopPropagation();
            });
          });

          document.body.addEventListener('click',()=>{
            headEl.classList.remove('typing');
          });
        }
      }catch(error){
        document.querySelector('.error-container').classList.add('show');
        document.querySelector('.additional-info-error').innerHTML = error.message;
      };
  };

  #removeCityFromSearchHistory(element){
    const cityDetails = {
      city : element.querySelector('.city-name').textContent,
      state : element.querySelector('.state-name') ? element.querySelector('.state-name').textContent : undefined,
      country : element.querySelector('.country-name').textContent,
      lat : element.dataset.lat,
      lon : element.dataset.lon
    };
    const index = this.#searchHistory.findIndex( cityDetails2 => (cityDetails2.city === cityDetails.city && cityDetails2.state === cityDetails.state && cityDetails2.country === cityDetails.country));
    if(index !== -1){
      this.#searchHistory.splice(index,1);
    }
    return cityDetails;
  };

  #loadingEffectSearch(){
    document.querySelector('header').classList.add('typing');
    const defaultHTML = `<div class="loading-search-text">Loading</div>`;
    this.#intervalIDSearch = this.#handleLoadingEffect('loading-search-text','search-options-container',defaultHTML);
  };

  #handleLoadingEffect(firstEl,secondEl,defaultHTML){
    document.querySelector(`.${secondEl}`).innerHTML  = defaultHTML;
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
  };

  async #getWeatherHandler(latitude,longitude){
    //cancel timer
    timer.cancelTimer();
    //display loading text
    document.querySelector('.weather-data-container').classList.add('show-loading-text');
    this.#intervalIDWeather = this.#handleLoadingEffect('loading-weather-text','loading-weather-text','Loading');
    //first display weather then add image 
    const {id} = await getWeather(latitude,longitude);
    const imageLink = `images/${id}.jpg`;
    //after adding weather data
    //remove the loading text
    clearInterval(this.#intervalIDWeather);
    document.querySelector('main').style.backgroundImage = `url(${imageLink})`;
    document.querySelector('.weather-data-container').classList.remove('show-loading-text');

    //start timer
    timer.startTimer();
  };

  async #handleSearch(){
    //cancel timer 
    timer.cancelTimer();
    this.#lastCallID++;
    //clear the auto suggestion timer and hide the suggested options
    clearTimeout(this.#timeoutId);
    document.querySelector('header').classList.remove('typing');
    const keyword = document.querySelector('input').value;

    if(keyword === ''){
      return;
    }
    //remove  "no-result" class if any
    document.querySelector('.weather-data-container').classList.remove('no-results');
    //display loading text
    document.querySelector('.weather-data-container').classList.add('show-loading-text');
    this.#intervalIDWeather = this.#handleLoadingEffect('loading-weather-text','loading-weather-text','Loading');

    try{
      const response = await fetch(`https://api.geoapify.com/v1/geocode/autocomplete?text=${keyword}&lang=en&format=json&apiKey=${geoCodingAPIKey}`);

      if(!response.ok) throw new Error('error found');
      
      const data = await response.json();

      if(!data.results.length || !data.results[0].city){
        //if no matching city is found then end the loading feature 
        //and display no results
        clearInterval(this.#intervalIDWeather);
        document.querySelector('.weather-data-container').classList.remove('show-loading-text');
        document.querySelector('.weather-data-container').classList.add('no-results');
        return;
      };

    
      const results = data.results;
      const cityDetails = {
        city : results[0].city,
        state : results[0].city === results[0].state ? results[0].region  : results[0].state || results[0].region,
        country : results[0].country,
        lat : results[0].lat,
        lon : results[0].lon
      };
      //check if this city is already present in the search history
      //if yes then remove it first before adding it
      const index = this.#searchHistory.findIndex( cityDetails2 => (cityDetails2.city === cityDetails.city && cityDetails2.state === cityDetails.state && cityDetails2.country === cityDetails.country));
      if(index !== -1){
        this.#searchHistory.splice(index,1);
      }
      this.#searchHistory.push(cityDetails);
      localStorage.setItem('searchHistory', JSON.stringify(this.#searchHistory));      

      //after saving the city details in the search history 
      //get the weather of this city 
      const {id} = await getWeather(cityDetails.lat,cityDetails.lon);
      const imageLink = `images/${id}.jpg`;
      //after adding weather data
      //remove the loading text
      clearInterval(this.#intervalIDWeather);
      document.querySelector('main').style.backgroundImage = `url(${imageLink})`;
      document.querySelector('.weather-data-container').classList.remove('show-loading-text');
      //also display the city name on search input
      document.querySelector('input').value = cityDetails.city;

      //start the timer 
      timer.startTimer();
    }catch(error){
      document.querySelector('.error-container').classList.add('show');
      document.querySelector('.additional-info-error').innerHTML = error.message;
    };
  };
};