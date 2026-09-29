const { DataTypes } = require("sequelize");
const sequelize = require("./sequelize");

const Patient = sequelize.define("patients", {
  patient_id: {
    type: DataTypes.STRING(36),
    primaryKey: true,
    allowNull: false
  },
  first_name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  last_name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  date_of_birth: {
    type: DataTypes.STRING(10),
    allowNull: false
  },
  sex: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  phone_number: {
    type: DataTypes.STRING(10),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(254),
    allowNull: true
  },
  address_line_1: {
    type: DataTypes.STRING,
    allowNull: false
  },
  address_line_2: {
    type: DataTypes.STRING,
    allowNull: true
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  state: {
    type: DataTypes.STRING(2),
    allowNull: false
  },
  zip_code: {
    type: DataTypes.STRING(10),
    allowNull: false
  },
  insurance_provider: {
    type: DataTypes.STRING,
    allowNull: true
  },
  insurance_member_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  preferred_language: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "English"
  },
  emergency_contact_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  emergency_contact_phone: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
  deleted_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  indexes: [
    { fields: ["last_name"] },
    { fields: ["date_of_birth"] },
    { fields: ["phone_number"] },
    { fields: ["deleted_at"] }
  ]
});

module.exports = Patient;
