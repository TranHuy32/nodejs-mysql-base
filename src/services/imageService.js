import path from 'path';
import express from 'express';
const { HOST, PORT } = process.env;

export const serveImage = (req, res) => {
  const imagePath = path.join(__dirname, '..', 'uploads', req.params.filename);
  res.sendFile(imagePath);
};

export const getUrl = (filename) => {
  return `http://${HOST}:${PORT}/images/${filename}`;
};
