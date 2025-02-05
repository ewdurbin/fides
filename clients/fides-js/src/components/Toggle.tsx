import { h } from "preact";

const Toggle = ({
  name,
  id,
  checked,
  onChange,
}: {
  name: string;
  id: string;
  checked: boolean;
  onChange: (noticeKey: string) => void;
}) => {
  const labelId = `toggle-${id}`;
  return (
    <label
      className="fides-toggle"
      htmlFor={name}
      data-testid={`toggle-${name}`}
      id={labelId}
    >
      <input
        type="checkbox"
        name={name}
        className="fides-toggle-input"
        onChange={() => {
          onChange(id);
        }}
        defaultChecked={checked}
        role="switch"
        aria-labelledby={labelId}
      />
      {/* Mark as `hidden` so it will fall back to a regular checkbox if CSS is not available */}
      <span className="fides-toggle-display" hidden />
    </label>
  );
};

export default Toggle;
