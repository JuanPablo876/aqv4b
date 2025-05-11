import React, { useState } from 'react';
import VenetianTile from './VenetianTile';

const InventoryOrderButton = ({ product, onOrder }) => {
  const [showMenu, setShowMenu] = useState(false);

  const handleOrderClick = () => {
    setShowMenu(!showMenu);
  };

  const handleCreateOrder = () => {
    onOrder(product);
    setShowMenu(false);
  };

  return (
    <div className="relative">
      <button
        onClick={handleOrderClick}
        className="text-blue-600 hover:text-blue-900"
      >
        Realizar Pedido
      </button>
      {showMenu && (
        <VenetianTile className="absolute right-0 mt-2 w-48 py-2 z-20">
          <button
            onClick={handleCreateOrder}
            className="block w-full text-left px-4 py-2 text-blue-800 hover:bg-blue-50"
          >
            Crear Pedido de Compra
          </button>
          {/* Add other potential order options here */}
        </VenetianTile>
      )}
    </div>
  );
};

export default InventoryOrderButton;