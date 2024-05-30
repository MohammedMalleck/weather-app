import { apiKeys } from "./keys.js";

const {rapidAPIKey , pixelAPIKey} = apiKeys;

export async function getImage(latitude, longitude){
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
export async function getAndSetImageFromCityName(){
  const cityName = document.querySelector('input').value;
  try{
    const response = await fetch(`https://api.pexels.com/v1/search?query=${cityName}&per_page=1`, {
      headers: {
        'Authorization': pixelAPIKey
      }
    });
    if(!response.ok) throw new Error('error when getting image from city name')
    const data = await response.json();
    const imgURL =  data.photos[0].src.original;
    document.querySelector('main').style.backgroundImage = `url(${imgURL})`;
  }catch(error){
    console.log(error.message)
  }

}