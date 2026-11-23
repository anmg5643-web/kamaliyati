# Kamaliyati backend

Express and Mongoose API, arranged in the same `config`, `controllers`, `models`, `routes`, and `utils` layers used by Baz Shop.

## Atlas connection

1. Use `.env` in this folder.
2. Replace `<URL_ENCODED_PASSWORD>` with the password for the Atlas database user. URL-encode reserved characters in the password. Keep `.env` local and never commit it.
3. Set a private admin password of at least 12 characters and a random `JWT_SECRET` of at least 32 characters.
4. The URI selects a separate database named `kamaliyati` on the existing Atlas cluster.

On first startup, the API inserts the ten current storefront products only if the `products` collection in `kamaliyati` is empty. It does not clear or replace existing collections. If an `ADMIN_USERNAME` and `ADMIN_PASSWORD` are configured, the first startup creates the admin record with a salted scrypt password hash. Admin login uses a seven-day signed token. Carts expire after 30 days. Completed orders and customer details are saved in MongoDB.

## API

- `GET /api/health`: backend and database state.
- `GET /api/products`: products from MongoDB.
- `GET /api/cart?cartId=...`: load a browser cart.
- `PUT /api/cart?cartId=...`: validate and save cart items.
- `DELETE /api/cart?cartId=...`: clear a browser cart.
- `POST /api/orders`: validate the customer form, create an order from the saved cart, and clear the cart.
- `POST /api/images`: upload a JPG, PNG, or WebP product image (admin token required, maximum 8 MB).
- `/api/auth/login`, `/api/products/admin/all`, product create/update/delete, and order listing/status updates require an admin token.

Run `npm run dev` or `npm start` from the project root after configuring `back/.env`.
