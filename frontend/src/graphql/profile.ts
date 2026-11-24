import { gql } from "@apollo/client";

export const PROFILE_QUERY = gql`
  query Profile {
    me { id name email createdAt updatedAt }
  }
`;

export const UPDATE_PROFILE_MUTATION = gql`
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) { id name email updatedAt }
  }
`;
