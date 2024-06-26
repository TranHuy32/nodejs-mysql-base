// Error handling when an error occurs
export const errorHandler = (err, req, res, next) => {
  return res.status(err.status || 500).json({
    success: false,
    status: err.status || 500,
    message: err.message || 'An internal server error occurred',
    date: err.date || new Date(),
  });
};

// Success response and return data
export const successHandler = (res, successMsg, successData) => {
  return res.status(200).json({
    success: true,
    status: 200,
    message: successMsg,
    data: successData,
  });
};
