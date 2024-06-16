function searchAddress2(inputAddress) {
    const fileNames = ['us_data_100k_1f.csv', 'us_data_100k_2f.csv', 'us_data_65k_3f.csv'];
    const workers = [];
    const results = [];
  
    return new Promise((resolve, reject) => {
      fileNames.forEach(fileName => {
        const worker = new Worker('worker.js');
        worker.postMessage({ address: inputAddress, fileName });
        
        worker.onmessage = function(e) {
          const { status, fileName, matchingRows, error } = e.data;
          if (status === 'success') {
            results.push(...matchingRows);
          } else {
            console.error(`Error in file ${fileName}: ${error}`);
          }
  
          // 当所有workers都完成时
          if (results.length > 0 || workers.every(worker => worker.terminated)) {
            resolve(results);
          }
        };
  
        workers.push(worker);
      });
    });
  }
  