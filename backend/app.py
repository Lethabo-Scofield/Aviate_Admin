import os

from flask import Flask, jsonify
from flask_cors import CORS
from sqlalchemy import text, inspect

from config import ALLOWED_ORIGINS
from models import init_db, engine
from routes import auth_bp, jobs_bp, drivers_bp, stops_bp, optimization_bp, stats_bp


def create_app():
    app = Flask(__name__)

    if ALLOWED_ORIGINS == "*":
        CORS(app)
    else:
        CORS(app, origins=[o.strip() for o in ALLOWED_ORIGINS.split(",")])

    init_db()
    _run_migrations()

    app.register_blueprint(auth_bp)
    app.register_blueprint(jobs_bp)
    app.register_blueprint(drivers_bp)
    app.register_blueprint(stops_bp)
    app.register_blueprint(optimization_bp)
    app.register_blueprint(stats_bp)

    @app.route("/")
    def root():
        return jsonify({"status": "ok", "service": "Aviate Dispatch API"})

    return app


def _run_migrations():
    with engine.connect() as conn:
        inspector = inspect(engine)
        table_names = inspector.get_table_names()

        def add_col_if_missing(table, col_name, col_def):
            if table in table_names:
                cols = [c["name"] for c in inspector.get_columns(table)]
                if col_name not in cols:
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col_name} {col_def}"))
                    conn.commit()
                    print(f"  Added {col_name} to {table}")

        add_col_if_missing("jobs", "route_geometry", "TEXT")
        add_col_if_missing("jobs", "company_id", "VARCHAR REFERENCES companies(id)")
        add_col_if_missing("stops", "company_id", "VARCHAR REFERENCES companies(id)")
        add_col_if_missing("drivers", "company_id", "VARCHAR REFERENCES companies(id)")
        add_col_if_missing("drivers", "user_id", "VARCHAR")
        add_col_if_missing("users", "driver_id", "VARCHAR")


app = create_app()

if __name__ == "__main__":
    print("Aviate Dispatch API starting on port 8000")
    app.run(
        debug=os.environ.get("FLASK_DEBUG", "false").lower() == "true",
        host="0.0.0.0",
        port=8000,
    )
