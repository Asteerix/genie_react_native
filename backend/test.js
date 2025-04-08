import "./styles.css";

const query = `
  query amazonProduct {  
    amazonProduct(input: {asin: "B0B3JBVDYP"}) {
      title
      mainImageUrl
      rating
      price {
        display 
      }  
    }
  }
`;

async function getExampleData(data = {}) {
  const response = await fetch("https://graphql.canopyapi.co/", {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
      "API-KEY": "d4ae64c9-bbb5-4814-9522-9e51d3d7c95b"
    },
    body: JSON.stringify(data) // body data type must match "Content-Type" header
  });
  return response.json(); // parses JSON response into native JavaScript objects
}

const runExample = async () => {
  const { data, error, errors } = await getExampleData({
    query
  });
  if (errors) {
    errors.forEach((e) => console.log(e.message));
  }
  if (!data && !error) {
    const warning = `Replace <YOUR_API_KEY> with your API key from the Canopy Dashboard`;
    document.getElementById("app").innerHTML = warning;
    console.warn(warning);
    return;
  }
  const { amazonProduct } = data;
  document.getElementById("app").innerHTML = `
  <h1>Product: ${amazonProduct.title}</h1>
  <img width="200" src="${amazonProduct.mainImageUrl}" />
  <p>Rating: ${amazonProduct.rating}</p>
  <p>Price: ${amazonProduct?.price?.display ?? "Unavailable"}</p>
`;
};

console.log("running");
runExample();
