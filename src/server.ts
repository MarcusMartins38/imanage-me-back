import express from 'express';

const app = express();

app.get('/', (req, res) => {
    res.send('Success');
})

app.listen(3333, () => {
    console.log("Running")
});
