import os
import joblib
from sklearn.tree import export_text

def main():
    model_path = os.path.join(os.path.dirname(__file__), "model.pkl")
    if not os.path.exists(model_path):
        print(f"Error: {model_path} not found. Please run train.py first.")
        return

    print(f"Loading model bundle from {model_path}...\n")
    bundle = joblib.load(model_path)
    clf = bundle["clf"]
    le_breed = bundle["le_breed"]
    le_gender = bundle["le_gender"]

    print("================ BREED ENCODING MAPPING ================")
    for idx, breed_name in enumerate(le_breed.classes_):
        print(f"  ID {idx} -> {breed_name}")
    print("========================================================\n")

    print("================ GENDER ENCODING MAPPING ===============")
    for idx, gender_name in enumerate(le_gender.classes_):
        print(f"  ID {idx} -> {gender_name}")
    print("========================================================\n")

    feature_names = ["Breed_enc", "Gender_enc", "Age", "Weight"]
    rules = export_text(clf, feature_names=feature_names)

    print("================ DECISION TREE IF-ELSE RULES ================")
    print(rules)
    print("=============================================================")

if __name__ == "__main__":
    main()
