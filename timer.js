import { getWeather } from "./weather.js";
export class TimerWeather{
  #intervalID;

  startTimer(){
   this.#intervalID =  setInterval(()=>{
    const {lat,lon} = document.querySelector('header').dataset;
    getWeather(lat,lon);
   },5 * 60 * 1000);
  };

  cancelTimer(){
    clearInterval(this.#intervalID);
  }
}