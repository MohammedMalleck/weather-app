import { getWeather } from "./weather.js";
import { getImage } from "./images.js";
import { InputEvent } from "./search.js";


async function loader() {
  const {longitude , latitude} =  await getCurrentLocation();
  document.querySelector("progress").value = 40;
  await getWeather(latitude,longitude);
  document.querySelector("progress").value = 70;
  const bgImage = await getImage(latitude, longitude);
  document.querySelector("progress").value = 100;
  //add image first then display weather
  setTimeout(()=>{
    document.querySelector('.loader-container').classList.add('hide');
    document.querySelector("main").classList.add('addMask');
    document.querySelector("main").style.backgroundImage = `url(${bgImage})`;
  },500)
  setTimeout(() => {
    document.querySelector("main").classList.add("loadAnimation");
  }, 1000);
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

new InputEvent(document.querySelector('input'));