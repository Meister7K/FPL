
import React from 'react';

const Loader: React.FC = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
    <div className="border-t-4 border-rose-500 border-solid rounded-full w-16 h-16 animate-spin"></div>
  </div>
);

export default Loader;
