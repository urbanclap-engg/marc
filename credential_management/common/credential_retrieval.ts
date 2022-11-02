import * as Singleton from "../../singleton";

interface SecretInterface {
  secretIdentifier: string;
  vaultPath: string;
}

const fetchCredentialsFromVault = async (secretPaths: SecretInterface[]) => {
  const securitas = Singleton.getSingleton()["securitas"];
  return securitas.fetchCredentialsFromVault(secretPaths);
};

export { fetchCredentialsFromVault };
