import PropTypes from 'prop-types';

export default function FormLabel({ children, spacing = 'mb-1.5' }) {
  return (
    <label className={`text-xs font-semibold text-gray-400 uppercase tracking-wide ${spacing} block`}>
      {children}
    </label>
  );
}

FormLabel.propTypes = {
  children: PropTypes.node.isRequired,
  spacing: PropTypes.string
};
