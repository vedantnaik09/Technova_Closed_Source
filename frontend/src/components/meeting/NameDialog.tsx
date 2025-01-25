import React, { useState, useEffect, useRef } from 'react';

interface IdDialogProps {
  setMyId: (id: string) => void;
}

const IdDialog: React.FC<IdDialogProps> = ({ setMyId }) => {
  const [inputValue, setInputValue] = useState<string>('');
  const [showDialog, setShowDialog] = useState<boolean>(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check if a user ID is already stored in session storage
    const storedId = sessionStorage.getItem('userId');
    if (storedId) {
      setMyId(storedId);
      setShowDialog(false);
    }
  }, [setMyId]);

  useEffect(() => {
    if (showDialog && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showDialog]);

  const handleSubmit = () => {
    if (inputValue.trim()) {
      // Store the user ID in session storage
      sessionStorage.setItem('userId', inputValue);
      setMyId(inputValue); // This updates the parent's state
      setShowDialog(false);
    }
  };

  if (!showDialog) {
    return null;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-zinc-900 p-8 rounded-xl shadow-lg w-96">
        <h2 className="text-xl font-bold mb-4">Enter your ID</h2>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          ref={inputRef}
          className="border border-gray-300 rounded w-full p-2 mb-4"
          placeholder="Type your ID"
        />
        <button
          onClick={handleSubmit}
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
        >
          Submit
        </button>
      </div>
    </div>
  );
};

export default IdDialog;
