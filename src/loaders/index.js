import expressLoader from './expressLoader';

const loader = async (app) => {
  await expressLoader(app);
};

export default loader;
