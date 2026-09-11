ALTER TABLE feature_flags
ADD CONSTRAINT ck_feature_flags_name_not_blank
CHECK (btrim(name) <> '');


ALTER TABLE targeting_rules
ADD CONSTRAINT ck_targeting_rules_attribute_supported
CHECK (
    attribute IN (
        'userkey',
        'country',
        'plan',
        'email'
    )
);


ALTER TABLE targeting_rules
ADD CONSTRAINT ck_targeting_rules_comparison_value_not_blank
CHECK (btrim(comparison_value) <> '');
