DELETE FROM targeting_rules rule
WHERE NOT EXISTS (
    SELECT 1
    FROM feature_flags flag
    WHERE flag.name = rule.flag_name
      AND flag.environment = rule.environment
);


DO $$
BEGIN

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'uq_feature_flags_name_environment'
    ) THEN

        ALTER TABLE feature_flags
        ADD CONSTRAINT uq_feature_flags_name_environment
        UNIQUE (
            name,
            environment
        );

    END IF;

END
$$;


DO $$
BEGIN

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'ck_feature_flags_environment'
    ) THEN

        ALTER TABLE feature_flags
        ADD CONSTRAINT ck_feature_flags_environment
        CHECK (
            environment IN (
                'dev',
                'staging',
                'prod'
            )
        );

    END IF;

END
$$;


DO $$
BEGIN

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_targeting_rules_feature_flag'
    ) THEN

        ALTER TABLE targeting_rules
        ADD CONSTRAINT fk_targeting_rules_feature_flag
        FOREIGN KEY (
            flag_name,
            environment
        )
        REFERENCES feature_flags (
            name,
            environment
        )
        ON DELETE CASCADE;

    END IF;

END
$$;


CREATE INDEX IF NOT EXISTS idx_targeting_rules_lookup
ON targeting_rules(
    flag_name,
    environment,
    priority,
    id
);


GRANT SELECT, INSERT, UPDATE, DELETE
ON feature_flags, targeting_rules
TO flagtether_app;


GRANT SELECT, INSERT
ON audit_log
TO flagtether_app;