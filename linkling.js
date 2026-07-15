
async function getWords(wordlist){
    let data = await fetch(wordlist);
    let words = await data.text();
    words = words.split("\r\n").slice(26, -1);
    for (let i = 0; i < words.length; i++) {
        words[i] = words[i].replace(/[^a-zA-Z0-9]/g, "");
    }
    return words;
}

function generatePuzzle(words){
    let start = words[Math.floor(Math.random()*words.length)];
    let target = words[Math.floor(Math.random()*words.length)];
    while(target.length % 2 !== 0){
        target = words[Math.floor(Math.random()*words.length)];
    }
    return [start, target];
}

async function setup(wordlist){
    let words = await getWords(wordlist);
    let puzzle = generatePuzzle(words);
}