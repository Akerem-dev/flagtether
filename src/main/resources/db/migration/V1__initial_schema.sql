CREATE TABLE IF NOT EXISTS feature_flags (
    id BIGSERIAL PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    environment VARCHAR(20) NOT NULL DEFAULT 'dev',

    enabled BOOLEAN NOT NULL DEFAULT FALSE,

    rollout_percentage INTEGER NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT ck_feature_flags_rollout
        CHECK (
            rollout_percentage >= 0
            AND rollout_percentage <= 100
        ),

    CONSTRAINT ck_feature_flags_environment
        CHECK (
            environment IN (
                'dev',
                'staging',
                'prod'
            )
        ),

    CONSTRAINT uq_feature_flags_name_environment
        UNIQUE (
            name,
            environment
        )
);


CREATE TABLE IF NOT EXISTS targeting_rules (
    id BIGSERIAL PRIMARY KEY,

    flag_name VARCHAR(100) NOT NULL,

    environment VARCHAR(20) NOT NULL,

    attribute VARCHAR(50) NOT NULL,

    operator VARCHAR(30) NOT NULL,

    comparison_value VARCHAR(255) NOT NULL,

    serve_enabled BOOLEAN NOT NULL,

    priority INTEGER NOT NULL DEFAULT 100,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT ck_targeting_rules_environment
        CHECK (
            environment IN (
                'dev',
                'staging',
                'prod'
            )
        ),

    CONSTRAINT ck_targeting_rules_operator
        CHECK (
            operator IN (
                'EQUALS',
                'NOT_EQUALS',
                'CONTAINS',
                'STARTS_WITH',
                'ENDS_WITH'
            )
        ),

    CONSTRAINT ck_targeting_rules_priority
        CHECK (
            priority >= 0
        ),

    CONSTRAINT fk_targeting_rules_feature_flag
        FOREIGN KEY (
            flag_name,
            environment
        )
        REFERENCES feature_flags (
            name,
            environment
        )
        ON DELETE CASCADE
);


CREATE INDEX IF NOT EXISTS idx_targeting_rules_lookup
ON targeting_rules(
    flag_name,
    environment,
    priority,
    id
);


CREATE TABLE IF NOT EXISTS audit_log (
    id BIGSERIAL PRIMARY KEY,

    action VARCHAR(50) NOT NULL,

    flag_name VARCHAR(100),

    environment VARCHAR(20),

    details TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE INDEX IF NOT EXISTS idx_audit_log_created_at
ON audit_log(
    created_at DESC
);


CREATE INDEX IF NOT EXISTS idx_audit_log_flag
ON audit_log(
    flag_name,
    environment
);


GRANT SELECT, INSERT, UPDATE, DELETE
ON feature_flags, targeting_rules
TO releasepilot_app;


GRANT SELECT, INSERT
ON audit_log
TO releasepilot_app;


GRANT USAGE, SELECT
ON feature_flags_id_seq,
   targeting_rules_id_seq,
   audit_log_id_seq
TO releasepilot_app;