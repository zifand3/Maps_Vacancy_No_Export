importScripts('https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.0/papaparse.min.js');

function parseAddress(address) {
  const parts = address.split(',').map(part => part.trim());

  const cityStateZip = parts[2].trim().split(' ');
  const state = cityStateZip[0];
  const zip = cityStateZip[1];

  const addressNumberMatch = parts[0].match(/\d+/);
  const addressNumber = addressNumberMatch ? addressNumberMatch[0] : null;
  
  const firstWord = parts[0].split(' ')[0];

  return {
    AddressNumber: addressNumber,
    FirstWord: firstWord,
    City: parts[1],
    State: state,
    Zipcode: zip
  };
}

function addressNumberMatch(address, number) {
  if (address === undefined) {
    return false;
  }
  if (typeof address !== 'string') {
    console.error('address is not a string:', address);
    return false;
  }
  if (!number) {
    console.error('number is null or undefined');
    return false;
  }
  const addressNumberMatch = address.match(/\d+/);
  if (!addressNumberMatch) {
    return false; 
  }
  return addressNumberMatch[0] === number;
}

function searchAddressInFile(fileName, searchValues) {
  return new Promise((resolve, reject) => {
    Papa.parse(fileName, {
      download: true,
      header: true,
      complete: function(results) {
        const data = results.data;
        let matchingRows = [];

        data.forEach(row => {
          let isAddressMatch = false;
          if (searchValues.AddressNumber) {
            isAddressMatch = addressNumberMatch(row.street, searchValues.AddressNumber);
          } else {
            isAddressMatch = row.Address && row.Address.includes(searchValues.FirstWord);
          }
          const isCityMatch = row.city === searchValues.City;
          const isStateMatch = row.state === searchValues.State;
          const isZipcodeMatch = row.zip === searchValues.Zipcode;

          if (isAddressMatch && isCityMatch && isStateMatch && isZipcodeMatch) {
            matchingRows.push(row);
          }
        });

        if (matchingRows.length > 0) {
          resolve(matchingRows);
        } else {
          reject(new Error(`No matching rows found in ${fileName}`));
        }
      }
    });
  });
}

self.onmessage = function(e) {
  const { address, fileName } = e.data;
  const searchValues = parseAddress(address);

  searchAddressInFile(fileName, searchValues)
    .then(matchingRows => {
      self.postMessage({ status: 'success', fileName, matchingRows });
    })
    .catch(error => {
      self.postMessage({ status: 'error', fileName, error: error.message });
    });
};
