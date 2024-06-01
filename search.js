import { apiKeys } from "./keys.js";
import { getWeather } from "./weather.js";


const { geoCodingAPIKey } = apiKeys;

export class InputEvent{

  #timeoutId;
  #intervalIDSearch;
  #intervalIDWeather;
  #searchHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];

  constructor(element){
    element.addEventListener('input',()=>{
      clearInterval(this.#intervalIDSearch);
      this.#loadingEffectSearch();
      clearTimeout(this.#timeoutId);
      this.#timeoutId =  setTimeout(()=>{
        this.#autoSuggestCities();
      },1000);
    });

    //on clicking input element make sure that
    //search option does not get hidden.
    element.addEventListener('click',(e)=>{
      e.stopPropagation();
    });
  };
  
  async #autoSuggestCities(){
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

        if(!data.results.length){
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

        //display search options container
        if(!headEl.classList.contains('typing')){
          headEl.classList.add('typing');
        }
        //clear out the interval
        clearInterval(this.#intervalIDSearch);
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
            console.log(this.#searchHistory)
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
      }catch(error){
        console.log(error.message)
      };
  };

  #removeCityFromSearchHistory(element){
    const cityDetails = {
      city : element.querySelector('.city-name').textContent,
      state : element.querySelector('.state-name').textContent,
      country : element.querySelector('.country-name').textContent
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
    document.querySelector('.search-options-container').innerHTML = defaultHTML;
    this.#intervalIDSearch = this.#handleLoadingEffect('loading-search-text','search-options-container',defaultHTML);
  };

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
  };

  async #getWeatherHandler(latitude,longitude){
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
  };


};