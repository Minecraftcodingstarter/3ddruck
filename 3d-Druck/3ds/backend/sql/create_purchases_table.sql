CREATE TABLE IF NOT EXISTS purchases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  quantity INT NOT NULL,
  address TEXT NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  city VARCHAR(100) NOT NULL,
  scaled_dimensions TEXT NOT NULL,
  purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
