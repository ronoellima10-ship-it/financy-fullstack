import { gql } from "@apollo/client";

export const DASHBOARD_QUERY = gql`
  query Dashboard {
    me {
      id
      name
      email
    }
    dashboard {
      totalBalance
      monthlyIncome
      monthlyExpense
      referenceMonth
      recentTransactions {
        id
        title
        amount
        type
        date
        category {
          id
          name
          icon
          color
        }
      }
      categorySummary {
        transactionCount
        totalAmount
        category {
          id
          name
          icon
          color
        }
      }
    }
  }
`;
