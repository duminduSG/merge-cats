const fs = require('fs');
const { join } = require('path');
const blend = require('@mapbox/blend');
const argv = require('minimist')(process.argv.slice(2));
const axios = require('axios');
const util = require('util');
const promisifiedBlend = util.promisify(blend);

const outputFile = join(process.cwd(), `/cat-card.jpg`);

const {
    greeting = 'Hello',
    who = 'You',
    width = 400,
    height = 500,
    color = 'Pink',
    size = 100,
} = argv;

const urlBuilder = (text, width, height, color, size) => {
    return `https://cataas.com/cat/says/${text}?width=${width}&height=${height}&color=${color}&s=${size}`;
}

const getRequest = async(text, width, height, color, size) =>  {
    const url = urlBuilder(text, width, height, color, size);
    return axios.get(url, { responseType: 'arraybuffer', responseEncoding: 'binary'})
}

const fetchCats = async (greeting, who, width, height, color, size) => {
    const [firstResponse, secondResponse] = await Promise.all([
        getRequest(greeting, width, height, color, size),
        getRequest(who, width, height, color, size),
    ]);
    console.log('Received response with status:' + firstResponse.status);
    console.log('Received response with status:' + secondResponse.status);
    return [firstResponse, secondResponse]
}

const mergeImages = async (firstResponse, secondResponse) => {
    return await promisifiedBlend(
        [{
            buffer: Buffer.from(firstResponse.data, 'binary'),
            x: 0,
            y: 0,
        }, {
            buffer: Buffer.from(secondResponse.data, 'binary'),
            x: width,
            y: 0,
        }], {
            width: width * 2,
            height: height,
            format: 'jpg',
        }
    );
}

const saveFile = async data => {
    const error = await fs.promises.writeFile(outputFile, data, 'binary');
    if (error) {
        console.log(error);
        return;
    }
    console.log('The file was saved!');

}

(async function() {
    const [firstResponse, secondResponse] = await fetchCats(greeting, who, width, height, color, size);
    const mergeImageData = await mergeImages(firstResponse, secondResponse);
    await saveFile(mergeImageData);
})();