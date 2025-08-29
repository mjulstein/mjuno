type BgColorButtonProps = {
  color: string;
  setColor: (color: string) => void;
};

export const BgColorButton = ({ color, setColor }: BgColorButtonProps) => {
  return <button className={color} onClick={() => setColor(color)}>
    <style>
      {`button.${color} {
              width: 2rem;
              height: 2rem;
              border: none;
              border-radius: 50%;
              cursor: pointer;
              border: 1px solid #ccc;
              background: ${color};
             }`}
    </style>
    <span className="sr-only">Set background to {color}</span>
  </button>;
};
